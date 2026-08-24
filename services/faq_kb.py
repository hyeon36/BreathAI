"""기존 문서 KB와 운영 승인 FAQ를 검색용 KB로 병합한다.

`gold_faq`에는 운영자가 최종 승인·수정한 질문, 답변, 키워드가 저장된다.
이 모듈은 활성 FAQ를 매 파이프라인 실행 시 읽어 기존 JSONL KB와 합치므로,
새로 반영된 FAQ가 다음 분석의 검색·답변 생성 근거로 사용된다.
"""
from __future__ import annotations

import json
import os
import re
from pathlib import Path
from typing import Any, Callable


ConnectionFactory = Callable[[], Any]


def _default_connection_factory():
    """AI 서버의 DB 환경변수 계약으로 MariaDB 연결을 생성한다."""
    import pymysql
    from pymysql.cursors import DictCursor

    return pymysql.connect(
        host=os.getenv("DB_HOST", "host.docker.internal"),
        port=int(os.getenv("DB_PORT", "3306")),
        user=os.getenv("DB_USER", "tbg_admin"),
        password=os.getenv("DB_PASSWORD", "tbg_pw_260501"),
        database=os.getenv("DB_NAME", "ttobagi_db"),
        charset="utf8mb4",
        cursorclass=DictCursor,
        autocommit=True,
    )


def load_base_kb(path: Path) -> list[dict]:
    """기존 문서 KB를 읽는다. 파일이 없으면 운영 FAQ만으로 동작한다."""
    if not path.exists():
        return []

    records: list[dict] = []
    with path.open(encoding="utf-8") as fp:
        for line_number, line in enumerate(fp, 1):
            line = line.strip()
            if not line:
                continue
            record = json.loads(line)
            if not str(record.get("text", "")).strip():
                raise ValueError(f"KB {path.name}:{line_number}에 text가 없습니다.")
            records.append(record)
    return records


def _parse_keywords(value: Any) -> list[str]:
    if value is None:
        return []
    if isinstance(value, list):
        return [str(item).strip() for item in value if str(item).strip()]
    if isinstance(value, str):
        stripped = value.strip()
        if not stripped:
            return []
        try:
            parsed = json.loads(stripped)
        except json.JSONDecodeError:
            parsed = [part.strip() for part in re.split(r"[,|]", stripped)]
        if isinstance(parsed, list):
            return [str(item).strip() for item in parsed if str(item).strip()]
    return []


def _faq_to_kb_record(row: dict) -> dict:
    faq_id = int(row["faq_id"])
    question = str(row.get("question") or "").strip()
    answer = str(row.get("answer") or "").strip()
    keywords = _parse_keywords(row.get("keywords"))
    keyword_text = ", ".join(keywords)

    parts = [f"질문: {question}", f"답변: {answer}"]
    if keyword_text:
        parts.append(f"키워드: {keyword_text}")

    return {
        "source_type": "approved_faq",
        "source_url": None,
        "menuIdx": None,
        "page_label": f"운영 FAQ #{faq_id}",
        "chunk_id": f"gold_faq:{faq_id}",
        "faq_id": faq_id,
        "question": question,
        "answer": answer,
        "keywords": keywords,
        "text": "\n".join(parts),
    }


def load_approved_faqs(
    connection_factory: ConnectionFactory | None = None,
) -> list[dict]:
    """`gold_faq`의 활성 FAQ를 검색 KB 레코드로 변환한다."""
    factory = connection_factory or _default_connection_factory
    conn = factory()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT faq_id, question, answer, keywords
                FROM gold_faq
                WHERE is_active = 1
                ORDER BY faq_id
                """
            )
            rows = cursor.fetchall()
    finally:
        conn.close()

    return [
        _faq_to_kb_record(row)
        for row in rows
        if str(row.get("question") or "").strip()
        and str(row.get("answer") or "").strip()
    ]


def _question_key(record: dict) -> str | None:
    question = record.get("question")
    if not question:
        return None
    return re.sub(r"\s+", "", str(question)).casefold()


def merge_kb(base_records: list[dict], approved_faqs: list[dict]) -> list[dict]:
    """기존 KB에 승인 FAQ를 병합한다. 동일 질문이면 승인본을 우선한다."""
    approved_keys = {
        key for record in approved_faqs
        if (key := _question_key(record)) is not None
    }
    retained_base = [
        record for record in base_records
        if _question_key(record) not in approved_keys
    ]
    return retained_base + approved_faqs


def load_current_kb(
    base_path: Path,
    connection_factory: ConnectionFactory | None = None,
) -> tuple[list[dict], dict[str, int]]:
    """현재 시점의 통합 KB와 출처별 건수를 반환한다."""
    base = load_base_kb(base_path)
    approved = load_approved_faqs(connection_factory)
    merged = merge_kb(base, approved)
    return merged, {
        "base": len(base),
        "approvedFaq": len(approved),
        "merged": len(merged),
    }
