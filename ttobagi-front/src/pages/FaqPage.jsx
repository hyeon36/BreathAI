import { useState, useEffect } from "react";
import { faqApi, dashApi } from "../api/index.js";

export default function FaqPage() {
  const [tab, setTab]               = useState("list");
  const [faqs, setFaqs]             = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [search, setSearch]         = useState("");
  const [loading, setLoading]       = useState(true);
  const [modal, setModal]           = useState(null);
  const [latestAnalysisId, setLatestAnalysisId] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");

    // 최신 analysisId 먼저 가져오기
    dashApi.getAnalysisHistory(0, 1, token).then((histRes) => {
      const latestId = histRes.data?.history?.[0]?.analysisId || null;
      setLatestAnalysisId(latestId);

      const requests = [faqApi.getList(0, 50, token)];
      if (latestId) requests.push(faqApi.getCandidates(latestId, token));

      Promise.all(requests).then(([listRes, candRes]) => {
        setFaqs(listRes.data?.faqList || []);
        setCandidates(candRes?.data?.recommendations || []);
        setLoading(false);
      });
    }).catch(() => setLoading(false));
  }, []);

  const handleReview = async (candidateId, action) => {
    const token = localStorage.getItem("token");
    const c = candidates.find((x) => x.candidateId === candidateId);
    if (!c) return;

    if (action === "ACCEPT") {
      if (!c.standardQuestion) {
        alert("표준 질문이 없는 후보는 승인할 수 없습니다.");
        return;
      }
      const applyRes = await faqApi.apply({
        analysisId: latestAnalysisId,
        clusterId: c.clusterId,
        clusterLabel: c.clusterLabel,
        candidateId: c.candidateId,
        finalQuestion: c.standardQuestion,
        finalAnswer: c.answerDraft,
        keywords: c.representativeKeywords || [],
        isManualPatchConfirmed: false,
      }, token);

      if (applyRes.success) {
        const listRes = await faqApi.getList(0, 50, token);
        setFaqs(listRes.data?.faqList || []);
      }
    }

    setCandidates((prev) =>
      prev.map((x) =>
        x.candidateId === candidateId
          ? { ...x, reviewStatus: action === "ACCEPT" ? "ACCEPTED" : "REJECTED" }
          : x
      )
    );
  };

  const handleUpdate = async (faq) => {
    const token = localStorage.getItem("token");
    await faqApi.update(faq.faqId, {
      question: faq.question,
      answer: faq.answer,
      keywords: faq.keywords,
    }, token);
    setFaqs((prev) => prev.map((f) => f.faqId === faq.faqId ? faq : f));
    setModal(null);
  };

  const handleDelete = async (faqId) => {
    const token = localStorage.getItem("token");
    await faqApi.remove(faqId, token);
    setFaqs((prev) => prev.filter((f) => f.faqId !== faqId));
  };

  const filteredFaqs = faqs.filter((f) =>
    f.question?.includes(search) ||
    f.answer?.includes(search) ||
    f.keywords?.some((k) => k.includes(search))
  );

  const pendingCount = candidates.filter((c) => c.reviewStatus === "PENDING").length;

  if (loading) return <div style={{ padding: 40, color: "#6B7280" }}>불러오는 중...</div>;

  return (
    <div style={S.page}>
      <div style={S.pageTitle}>FAQ 후보 관리</div>
      <div style={S.pageSub}>현재 등록된 FAQ를 확인하고 AI 추천 후보를 검토합니다.</div>

      <div style={S.tabs}>
        {[
          { key: "list",      label: `FAQ 리스트 (${faqs.length})` },
          { key: "recommend", label: `FAQ 후보 추천${pendingCount > 0 ? ` (검토 필요 ${pendingCount})` : ""}` },
        ].map((t) => (
          <div key={t.key}
            style={{ ...S.tab, ...(tab === t.key ? S.tabActive : {}) }}
            onClick={() => setTab(t.key)}>
            {t.label}
          </div>
        ))}
      </div>

      {/* ── FAQ 리스트 ── */}
      {tab === "list" && (
        <div>
          <div style={{ marginBottom: 14, display: "flex", gap: 10, alignItems: "center" }}>
            <input style={S.searchInput} placeholder="질문, 답변, 키워드로 검색..."
              value={search} onChange={(e) => setSearch(e.target.value)} />
            <span style={{ fontSize: 12, color: "#6B7280" }}>총 {filteredFaqs.length}개</span>
          </div>

          {filteredFaqs.length === 0 ? (
            <div style={S.empty}><div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div><div>검색 결과가 없습니다.</div></div>
          ) : (
            filteredFaqs.map((f) => (
              <div key={f.faqId} style={S.faqCard}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={S.faqQ}>{f.question}</div>
                    <div style={S.faqA}>{f.answer}</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 8 }}>
                      {f.keywords?.map((k) => <span key={k} style={S.tag}>{k}</span>)}
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, marginLeft: 16 }}>
                    {f.qaCnt > 0 && <span style={S.qaCnt}>누적 {f.qaCnt.toLocaleString()}건</span>}
                    <div style={{ display: "flex", gap: 6 }}>
                      <button style={S.btnSm} onClick={() => setModal({ type: "edit", data: f })}>수정</button>
                      <button style={S.btnSmDanger} onClick={() => handleDelete(f.faqId)}>삭제</button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── FAQ 후보 추천 ── */}
      {tab === "recommend" && (
        <div>
          <div style={S.infoBanner}>
            🤖 LLM API가 미답변 로그를 분석하여 신규 FAQ 후보를 추천합니다. 승인하면 FAQ DB에 자동 반영됩니다.
          </div>

          {candidates.length === 0 ? (
            <div style={S.empty}><div style={{ fontSize: 32, marginBottom: 8 }}>✨</div><div>추천 후보가 없습니다.</div></div>
          ) : (
            candidates.map((c) => (
              <div key={c.candidateId} style={{
                ...S.candCard,
                borderLeft: `4px solid ${(c.reviewStatus === "ACCEPTED" || c.reviewStatus === "APPLIED") ? "#43A047" : c.reviewStatus === "REJECTED" ? "#E53935" : "#1565C0"}`,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                      <span style={{
                        fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 10,
                        background: c.candidateType === "NEW" ? "#DBEAFE" : "#EDE9FE",
                        color: c.candidateType === "NEW" ? "#1E40AF" : "#5B21B6",
                      }}>
                        {c.candidateType === "NEW" ? "신규 FAQ" : "키워드 확장"}
                      </span>
                      <span style={{ fontSize: 11, color: "#9CA3AF" }}>매칭 {c.occurrenceCount}건</span>
                    </div>
                    <div style={S.faqQ}>{c.standardQuestion}</div>
                  </div>

                  {c.reviewStatus === "PENDING" ? (
                    <div style={{ display: "flex", gap: 6, marginLeft: 12 }}>
                      <button style={S.btnSm} onClick={() => setModal({ type: "detail", data: c })}>상세보기</button>
                      <button style={S.btnAccept} onClick={() => handleReview(c.candidateId, "ACCEPT")}>✓ 승인</button>
                      <button style={S.btnReject} onClick={() => handleReview(c.candidateId, "REJECT")}>✗ 반려</button>
                    </div>
                  ) : (
                    <span style={{
                      fontSize: 12, fontWeight: 500, padding: "4px 14px", borderRadius: 20, marginLeft: 12,
                      background: (c.reviewStatus === "ACCEPTED" || c.reviewStatus === "APPLIED") ? "#D1FAE5" : "#FDECEA",
                      color: (c.reviewStatus === "ACCEPTED" || c.reviewStatus === "APPLIED") ? "#065F46" : "#B91C1C",
                    }}>
                      {(c.reviewStatus === "ACCEPTED" || c.reviewStatus === "APPLIED") ? "✅ 승인됨" : "❌ 반려됨"}
                    </span>
                  )}
                </div>

                <div style={S.faqA}>{c.answerDraft}</div>

                <div style={{ marginTop: 8, marginBottom: 4, fontSize: 11, color: "#6B7280" }}>대표 키워드</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 10 }}>
                  {c.representativeKeywords?.map((k) => (
                    <span key={k} style={{ ...S.tag, background: "#EEF2FF", color: "#4338CA", borderColor: "#C7D2FE" }}>{k}</span>
                  ))}
                </div>

                <div style={{ fontSize: 11, color: "#6B7280", marginBottom: 4 }}>유사어 / 오타</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {c.synonyms?.map((s, i) => (
                    <span key={i} style={{
                      fontSize: 11, padding: "2px 8px", borderRadius: 12,
                      background: s.type === "TYPO" ? "#FEF3C7" : s.type === "ABBR" ? "#F0FDF4" : "#EFF8FF",
                      color: s.type === "TYPO" ? "#92400E" : s.type === "ABBR" ? "#166534" : "#1565C0",
                      border: `1px solid ${s.type === "TYPO" ? "#FDE68A" : s.type === "ABBR" ? "#BBF7D0" : "#BFDBFE"}`,
                    }}>
                      {s.text}
                      <span style={{ fontSize: 9, marginLeft: 3, opacity: 0.6 }}>
                        {s.type === "TYPO" ? "오타" : s.type === "ABBR" ? "약어" : "유사어"}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── 상세보기 모달 ── */}
      {modal?.type === "detail" && (
        <div style={S.modalBg} onClick={() => setModal(null)}>
          <div style={S.modal} onClick={(e) => e.stopPropagation()}>
            <div style={S.modalTitle}>FAQ 후보 상세</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14, fontSize: 13 }}>
              <div>
                <div style={S.modalLabel}>표준 질문</div>
                <div style={S.modalValue}>{modal.data.standardQuestion}</div>
              </div>
              <div>
                <div style={S.modalLabel}>답변 초안</div>
                <div style={{ ...S.modalValue, lineHeight: 1.7 }}>{modal.data.answerDraft}</div>
              </div>
              <div>
                <div style={S.modalLabel}>유사어</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 6 }}>
                  {modal.data.synonyms?.map((s, i) => (
                    <span key={i} style={{
                      fontSize: 11, padding: "2px 8px", borderRadius: 12,
                      background: s.type === "TYPO" ? "#FEF3C7" : "#EFF8FF",
                      color: s.type === "TYPO" ? "#92400E" : "#1565C0",
                      border: `1px solid ${s.type === "TYPO" ? "#FDE68A" : "#BFDBFE"}`,
                    }}>
                      {s.text}
                      <span style={{ fontSize: 9, marginLeft: 3, opacity: 0.6 }}>
                        {s.type === "TYPO" ? "오타" : s.type === "ABBR" ? "약어" : "유사어"}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", gap: 20 }}>
                <div>
                  <div style={S.modalLabel}>매칭 건수</div>
                  <div style={{ fontWeight: 600, fontSize: 16 }}>{modal.data.occurrenceCount}건</div>
                </div>
              </div>
            </div>
            <div style={S.modalActions}>
              <button style={S.btnSm} onClick={() => setModal(null)}>닫기</button>
              <button style={S.btnReject} onClick={() => { handleReview(modal.data.candidateId, "REJECT"); setModal(null); }}>✗ 반려</button>
              <button style={S.btnAccept} onClick={() => { handleReview(modal.data.candidateId, "ACCEPT"); setModal(null); }}>✓ 승인</button>
            </div>
          </div>
        </div>
      )}

      {/* ── 수정 모달 ── */}
      {modal?.type === "edit" && (
        <div style={S.modalBg} onClick={() => setModal(null)}>
          <div style={S.modal} onClick={(e) => e.stopPropagation()}>
            <div style={S.modalTitle}>FAQ 수정</div>
            <EditFaqForm faq={modal.data} onSave={handleUpdate} onClose={() => setModal(null)} />
          </div>
        </div>
      )}
    </div>
  );
}

function EditFaqForm({ faq, onSave, onClose }) {
  const [q, setQ]       = useState(faq.question);
  const [a, setA]       = useState(faq.answer);
  const [tags, setTags] = useState(faq.keywords?.join(", ") || "");

  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 8 }}>
        <div>
          <label style={S.modalLabel}>표준 질문</label>
          <input style={S.input} value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div>
          <label style={S.modalLabel}>답변</label>
          <textarea style={{ ...S.input, height: 100, resize: "vertical", paddingTop: 10 }}
            value={a} onChange={(e) => setA(e.target.value)} />
        </div>
        <div>
          <label style={S.modalLabel}>키워드 (쉼표로 구분)</label>
          <input style={S.input} value={tags} onChange={(e) => setTags(e.target.value)} />
        </div>
      </div>
      <div style={S.modalActions}>
        <button style={S.btnSm} onClick={onClose}>취소</button>
        <button style={{ ...S.btnAccept, padding: "8px 20px" }} onClick={() =>
          onSave({ ...faq, question: q, answer: a, keywords: tags.split(",").map((t) => t.trim()) })
        }>저장</button>
      </div>
    </div>
  );
}

const S = {
  page:        { padding: 28 },
  pageTitle:   { fontSize: 20, fontWeight: 700, color: "#111827", marginBottom: 4 },
  pageSub:     { fontSize: 13, color: "#6B7280", marginBottom: 20 },
  tabs:        { display: "flex", gap: 2, background: "#F3F4F6", borderRadius: 10, padding: 4, width: "fit-content", marginBottom: 20 },
  tab:         { padding: "8px 20px", borderRadius: 8, fontSize: 13, cursor: "pointer", color: "#6B7280" },
  tabActive:   { background: "#fff", color: "#1565C0", fontWeight: 600, boxShadow: "0 1px 3px rgba(0,0,0,.08)" },
  searchInput: { height: 40, padding: "0 14px", border: "1.5px solid #D1D5DB", borderRadius: 8, fontSize: 13, fontFamily: "inherit", outline: "none", width: 320, boxSizing: "border-box" },
  faqCard:     { background: "#fff", borderRadius: 12, padding: 18, marginBottom: 10, boxShadow: "0 1px 3px rgba(0,0,0,.06)", border: "1px solid rgba(0,0,0,.06)" },
  candCard:    { background: "#fff", borderRadius: 12, padding: 18, marginBottom: 12, boxShadow: "0 1px 3px rgba(0,0,0,.06)", border: "1px solid rgba(0,0,0,.06)" },
  faqQ:        { fontSize: 14, fontWeight: 600, color: "#111827", marginBottom: 4 },
  faqA:        { fontSize: 12, color: "#6B7280", lineHeight: 1.65 },
  tag:         { fontSize: 11, padding: "2px 9px", background: "#EFF8FF", color: "#1565C0", borderRadius: 12, border: "1px solid #BFDBFE" },
  qaCnt:       { fontSize: 11, color: "#6B7280", background: "#F3F4F6", padding: "2px 8px", borderRadius: 10 },
  infoBanner:  { background: "#EFF8FF", border: "1px solid #BFDBFE", borderRadius: 10, padding: "12px 16px", fontSize: 13, color: "#1E40AF", marginBottom: 16 },
  empty:       { background: "#fff", borderRadius: 12, padding: 48, textAlign: "center", color: "#9CA3AF", fontSize: 14 },
  btnSm:       { padding: "6px 14px", background: "#F3F4F6", color: "#374151", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" },
  btnSmDanger: { padding: "6px 14px", background: "#FDECEA", color: "#B91C1C", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" },
  btnAccept:   { padding: "6px 14px", background: "#D1FAE5", color: "#065F46", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" },
  btnReject:   { padding: "6px 14px", background: "#FDECEA", color: "#B91C1C", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" },
  input:       { width: "100%", height: 42, padding: "0 14px", border: "1.5px solid #D1D5DB", borderRadius: 8, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" },
  modalBg:     { position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 },
  modal:       { background: "#fff", borderRadius: 16, padding: 28, maxWidth: 540, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,.2)" },
  modalTitle:  { fontSize: 17, fontWeight: 700, color: "#111827", marginBottom: 16 },
  modalLabel:  { fontSize: 11, fontWeight: 600, color: "#6B7280", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 5, display: "block" },
  modalValue:  { fontSize: 13, color: "#111827" },
  modalActions:{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 20 },
};