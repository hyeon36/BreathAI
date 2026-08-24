"""또타24 KB 검색기 — BGE-M3 dense embedding + BGE-reranker 2-stage.

입력:  dataset/seoulmetro_kb_clean.jsonl (기존 문서 KB, 선택)
       MariaDB gold_faq                 (활성 운영 FAQ, 매 실행 동기화)
       dataset/faq_candidates.json       (질의 = standardQuestion)
출력:  dataset/kb_embeddings.npy         (KB 임베딩 캐시)
       dataset/faq_retrieval.json        (FAQ별 top-k 검색 결과)

설계:
  - 1차: BGE-M3 dense embedding cosine sim (top_k1=20)
  - 2차: BGE-reranker로 rerank (top_k2=5)
  - 표준질문이 비어있거나 FAQ 태그 아닌 클러스터는 스킵
"""
from __future__ import annotations

import hashlib
import json
import time
import unicodedata
from pathlib import Path

import numpy as np
import torch
from sentence_transformers import CrossEncoder, SentenceTransformer

from services.faq_kb import load_current_kb


def _nfd(p: Path) -> Path:
    return Path(unicodedata.normalize('NFD', str(p)))


# 경로
DATA_DIR = _nfd(Path(__file__).resolve().parent.parent / 'dataset')
KB_JSONL = DATA_DIR / 'seoulmetro_kb_clean.jsonl'
KB_EMB = DATA_DIR / 'kb_embeddings.npy'
KB_EMB_META = DATA_DIR / 'kb_embeddings.meta.json'
FAQ_JSON = DATA_DIR / 'faq_candidates.json'
OUTPUT_JSON = DATA_DIR / 'faq_retrieval.json'

# 모델
DENSE_MODEL = 'BAAI/bge-m3'
RERANK_MODEL = 'BAAI/bge-reranker-v2-m3'
DEVICE = 'cuda' if torch.cuda.is_available() else 'cpu'

TOP_K1 = 20    # dense retrieval
TOP_K2 = 5     # after rerank
BATCH_SIZE = 32


def load_kb() -> list[dict]:
    """
    기존 문서 KB와 DB의 활성 운영 FAQ를 병합해 로드한다.

    운영자가 신규 FAQ를 반영하면 `gold_faq`에 저장되며, 다음 실행부터
    이 함수가 해당 FAQ의 질문·답변·키워드를 검색 KB에 포함한다.
    """
    kb, counts = load_current_kb(KB_JSONL)
    if not kb:
        raise RuntimeError(
            '검색 가능한 KB가 없습니다. seoulmetro_kb_clean.jsonl을 제공하거나 '
            'gold_faq에 활성 FAQ를 등록해야 합니다.'
        )
    print(
        'KB 병합: '
        f'기존={counts["base"]}, 승인 FAQ={counts["approvedFaq"]}, '
        f'최종={counts["merged"]}'
    )
    return kb


def kb_fingerprint(kb: list[dict]) -> str:
    """FAQ 추가뿐 아니라 질문·답변·키워드 수정도 감지하는 콘텐츠 해시."""
    canonical = json.dumps(
        kb,
        ensure_ascii=False,
        sort_keys=True,
        separators=(',', ':'),
        default=str,
    )
    return hashlib.sha256(canonical.encode('utf-8')).hexdigest()


def build_or_load_index(
    kb: list[dict],
    force_rebuild: bool = False,
) -> np.ndarray:
    """
    KB 임베딩을 .npy로 캐시한다.
    force_rebuild=True면 캐시를 무시하고 재계산한다.
    """

    fingerprint = kb_fingerprint(kb)
    meta = None
    if KB_EMB_META.exists():
        try:
            meta = json.loads(KB_EMB_META.read_text(encoding='utf-8'))
        except (json.JSONDecodeError, OSError):
            meta = None

    cache_valid = (
        KB_EMB.exists()
        and meta is not None
        and meta.get('fingerprint') == fingerprint
        and meta.get('model') == DENSE_MODEL
        and meta.get('count') == len(kb)
    )

    if cache_valid and not force_rebuild:
        emb = np.load(KB_EMB)

        if emb.shape[0] == len(kb):
            print(f'KB 임베딩 캐시 hit: {KB_EMB.name} ({emb.shape})')
            return emb

        print('KB 임베딩 캐시 shape 불일치, 재계산')

    elif KB_EMB.exists() and not force_rebuild:
        print('KB 내용 변경 감지, 임베딩 재계산')

    print(f'KB 임베딩 계산 중 (n={len(kb)}, model={DENSE_MODEL})')

    enc = SentenceTransformer(DENSE_MODEL, device=DEVICE)
    texts = [c['text'] for c in kb]

    emb = enc.encode(
        texts,
        batch_size=BATCH_SIZE,
        normalize_embeddings=True,
        show_progress_bar=True,
        convert_to_numpy=True,
    )

    np.save(KB_EMB, emb)
    KB_EMB_META.write_text(
        json.dumps(
            {
                'fingerprint': fingerprint,
                'model': DENSE_MODEL,
                'count': len(kb),
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding='utf-8',
    )

    print(f'저장: {KB_EMB.name} ({emb.shape}, {KB_EMB.stat().st_size:,} bytes)')

    return emb


def search(
    query: str,
    enc: SentenceTransformer,
    kb: list[dict],
    kb_emb: np.ndarray,
    top_k: int = TOP_K1,
) -> list[dict]:
    """
    dense embedding cosine similarity 기반 top-k 검색.
    """

    q_emb = enc.encode(
        [query],
        normalize_embeddings=True,
        convert_to_numpy=True,
    )[0]

    sims = kb_emb @ q_emb
    idx = np.argsort(-sims)[:top_k]

    return [
        {
            **kb[i],
            'dense_score': float(sims[i]),
        }
        for i in idx
    ]


def rerank(
    query: str,
    candidates: list[dict],
    reranker: CrossEncoder,
    top_k: int = TOP_K2,
) -> list[dict]:
    """
    CrossEncoder 기반 reranking.
    """

    if not candidates:
        return []

    pairs = [
        (query, c['text'])
        for c in candidates
    ]

    scores = reranker.predict(
        pairs,
        show_progress_bar=False,
    )

    for c, s in zip(candidates, scores):
        c['rerank_score'] = float(s)

    candidates.sort(key=lambda c: -c['rerank_score'])

    return candidates[:top_k]


def load_faq_candidates() -> list[dict]:
    """
    faq_generator.py가 생성한 FAQ 후보를 로드한다.
    """

    if not FAQ_JSON.exists():
        raise FileNotFoundError(
            f"FAQ 후보 파일을 찾을 수 없습니다: {FAQ_JSON}"
        )

    data = json.loads(FAQ_JSON.read_text(encoding='utf-8'))

    return data.get('faqCandidates', [])


def run_for_faqs() -> None:
    """
    FAQ 후보의 standardQuestion을 질의로 사용해 KB 검색 결과를 생성한다.
    """

    kb = load_kb()
    print(f'KB chunks: {len(kb)}')

    kb_emb = build_or_load_index(kb)

    enc = SentenceTransformer(DENSE_MODEL, device=DEVICE)

    reranker = CrossEncoder(
        RERANK_MODEL,
        max_length=512,
        device=DEVICE,
        default_activation_function=torch.nn.Sigmoid(),
    )

    print(f'reranker loaded: {RERANK_MODEL}')

    candidates = load_faq_candidates()

    faqs = [
        c for c in candidates
        if c.get('tag') == 'FAQ' and c.get('standardQuestion')
    ]

    print(f'\n질의 (FAQ standardQuestion): {len(faqs)}개\n')

    results = []

    for i, c in enumerate(faqs, 1):
        q = c['standardQuestion']
        t0 = time.time()

        dense_candidates = search(
            query=q,
            enc=enc,
            kb=kb,
            kb_emb=kb_emb,
            top_k=TOP_K1,
        )

        top = rerank(
            query=q,
            candidates=dense_candidates,
            reranker=reranker,
            top_k=TOP_K2,
        )

        elapsed = time.time() - t0

        record = {
            'clusterLabel': c['clusterLabel'],
            'clusterSize': c['clusterSize'],
            'query': q,
            'retrieved': [
                {
                    'source_type': t.get('source_type', 'base_kb'),
                    'source_url': t.get('source_url'),
                    'menuIdx': t.get('menuIdx'),
                    'page_label': t.get('page_label'),
                    'chunk_id': t.get('chunk_id'),
                    'faq_id': t.get('faq_id'),
                    'question': t.get('question'),
                    'keywords': t.get('keywords', []),
                    'text': t.get('text'),
                    'dense_score': round(t.get('dense_score', 0.0), 4),
                    'rerank_score': round(t.get('rerank_score', 0.0), 4),
                }
                for t in top
            ],
        }

        results.append(record)

        best = top[0] if top else None

        if best:
            print(
                f'  [{i:>2}/{len(faqs)}] C{c["clusterLabel"]:>2}  '
                f'top={best["rerank_score"]:.3f}  '
                f'q="{q[:36]}" → "{str(best.get("page_label", ""))[:20]}"  '
                f'({elapsed:.2f}s)'
            )
        else:
            print(
                f'  [{i:>2}/{len(faqs)}] C{c["clusterLabel"]:>2}  no result'
            )

    OUTPUT_JSON.write_text(
        json.dumps(
            {
                'faqRetrieval': results,
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding='utf-8',
    )

    print(
        f'\n산출물: {OUTPUT_JSON.name} '
        f'({OUTPUT_JSON.stat().st_size:,} bytes, {len(results)}건)'
    )


def main() -> None:
    """
    run_pipeline.py에서 호출하는 retriever 단계 진입점.

    services/run_pipeline.py의 run_full_pipeline()은 RET.main()을 호출하므로,
    이 함수가 반드시 존재해야 한다.
    """

    run_for_faqs()


if __name__ == '__main__':
    main()
