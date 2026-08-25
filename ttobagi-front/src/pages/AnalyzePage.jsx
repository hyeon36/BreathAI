import { useState, useEffect } from "react";
import { dashApi, faqApi } from "../api/index.js";
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer } from "recharts";

const CLUSTER_COLORS = [
  "#1565C0","#43A047","#E53935","#FB8C00","#8E24AA",
  "#00838F","#F4511E","#3949AB","#00897B","#C0CA33",
];

function ClusterScatterPlot({ points, clusterNames }) {
  const colorMap = {};
  clusterNames.forEach((c, i) => {
    colorMap[c.clusterLabel] = CLUSTER_COLORS[i % CLUSTER_COLORS.length];
  });

  return (
    <div style={{ width: "100%", height: 400 }}>
      <ResponsiveContainer>
        <ScatterChart>
          <XAxis dataKey="x" type="number" name="X" tick={{ fontSize: 10 }} />
          <YAxis dataKey="y" type="number" name="Y" tick={{ fontSize: 10 }} />
          <Tooltip
            cursor={{ strokeDasharray: "3 3" }}
            content={({ payload }) => {
              if (!payload?.length) return null;
              const d = payload[0]?.payload;
              return (
                <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 8, padding: "8px 12px", fontSize: 12, maxWidth: 200 }}>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>클러스터 {d?.clusterLabel}</div>
                  <div style={{ color: "#6B7280", wordBreak: "break-all" }}>{d?.text?.slice(0, 50)}</div>
                </div>
              );
            }}
          />
          <Scatter data={points} isAnimationActive={false}>
            {points.map((p, i) => (
              <Cell key={i} fill={colorMap[p.clusterLabel] || "#9CA3AF"} opacity={0.7} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function AnalyzePage() {
  const [tab, setTab]               = useState("upload");
  const [file, setFile]             = useState(null);
  const [drag, setDrag]             = useState(false);
  const [uploading, setUploading]   = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [running, setRunning]       = useState(false);
  const [step, setStep]             = useState(-1);
  const [done, setDone]             = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [history, setHistory]       = useState([]);
  const [analyzeResult, setAnalyzeResult] = useState(null);

  const STEPS = ["데이터 전처리", "문장 임베딩", "군집화 (HDBSCAN)", "FAQ 초안 생성", "검증 완료"];

  useEffect(() => {
  const token = localStorage.getItem("token");
  dashApi.getAnalysisHistory(0, 1, token).then((r) => {
    if (r.data?.history) {
      setHistory(r.data.history);
      // 최신 분석이 COMPLETED면 FAQ 후보 자동 로드
      const latest = r.data.history[0];
      if (latest?.status === "COMPLETED" && latest?.analysisId) {
        faqApi.getCandidates(latest.analysisId, token).then((res) => {
          if (res.data?.recommendations) setCandidates(res.data.recommendations);
        });
        dashApi.getFileAnalyzeResult(latest.analysisId, token).then((res) => {
          if (res.data) setAnalyzeResult(res.data);
        });
        setDone(true);
        setStep(4);
      }
    }
  });
}, []);

  const handleFile = (f) => {
    if (!f.name.endsWith(".xlsx")) { alert(".xlsx 파일만 업로드 가능합니다."); return; }
    setFile(f);
  };

  const doUpload = async () => {
    if (!file) return;
    const token = localStorage.getItem("token");
    setUploading(true);
    setRunning(true);
    setDone(false);
    setStep(-1);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await dashApi.uploadAndAnalyze(formData, token);
      setUploading(false);

      if (res.success && res.data?.analysisId) {
        setUploadResult(res.data);
        const analysisId = res.data.analysisId;

        dashApi.streamAnalysisStatus(
          analysisId,
          token,
          (data) => {
            const parsed = JSON.parse(data);
            const status = parsed.status;
            if (status === "PREPROCESSING") setStep(0);
            if (status === "ANALYZING")     setStep(2);
            if (status === "COMPLETED") {
              setStep(4);
              setDone(true);
              setRunning(false);
              faqApi.getCandidates(analysisId, token).then((r) => {
                if (r.data?.candidates) setCandidates(r.data.candidates);
              });
              dashApi.getFileAnalyzeResult(analysisId, token).then((r) => {
                if (r.data) setAnalyzeResult(r.data);
              });
            }
            if (status === "FAIL") {
              setRunning(false);
              alert("분석에 실패했습니다.");
            }
          },
          () => {
            const poll = setInterval(async () => {
              const statusRes = await dashApi.getAnalysisStatus(analysisId, token);
              const status = statusRes.data?.status;
              if (status === "COMPLETED") {
                clearInterval(poll);
                setStep(4);
                setDone(true);
                setRunning(false);
                faqApi.getCandidates(analysisId, token).then((r) => {
                  if (r.data?.candidates) setCandidates(r.data.candidates);
                });
                dashApi.getFileAnalyzeResult(analysisId, token).then((r) => {
                  if (r.data) setAnalyzeResult(r.data);
                });
              }
              if (status === "FAIL") {
                clearInterval(poll);
                setRunning(false);
                alert("분석에 실패했습니다.");
              }
            }, 3000);
          }
        );
      }
    } catch {
      setUploading(false);
      setRunning(false);
      alert("업로드에 실패했습니다.");
    }
  };

  const handleCandidate = (id, action) => {
    setCandidates((prev) =>
      prev.map((c) => c.candidateId === id ? { ...c, reviewStatus: action } : c)
    );
  };

  return (
    <div style={S.page}>
      <div style={S.pageTitle}>신규 데이터 분석</div>
      <div style={S.pageSub}>미답변 로그를 업로드하고 AI 분석을 실행합니다.</div>

      {/* 탭 */}
      <div style={S.tabs}>
        {[
          { key: "upload",    label: "① 업로드 · 분석" },
          { key: "visual",    label: "② 시각화 · 비교" },
          { key: "recommend", label: `③ FAQ 추천 ${candidates.length > 0 ? `(${candidates.filter(c => c.reviewStatus === "PENDING").length})` : ""}` },
        ].map((t) => (
          <div key={t.key} style={{ ...S.tab, ...(tab === t.key ? S.tabActive : {}) }}
            onClick={() => setTab(t.key)}>{t.label}</div>
        ))}
      </div>

      {/* ── 탭 1: 업로드 · 분석 ── */}
      {tab === "upload" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 16 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={S.card}>
              <div style={S.cardHeader}>
                <span style={S.cardTitle}>① 신규 로그 엑셀 업로드</span>
                <span style={S.badge}>1달 분량</span>
              </div>
              <div style={S.cardBody}>
                <input type="file" accept=".xlsx" style={{ display: "none" }} id="fileInput"
                  onChange={(e) => handleFile(e.target.files[0])} />
                <div
                  style={{ ...S.dropzone, ...(drag ? S.dropzoneDrag : {}) }}
                  onClick={() => document.getElementById("fileInput").click()}
                  onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
                  onDragLeave={() => setDrag(false)}
                  onDrop={(e) => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files[0]); }}>
                  <div style={{ fontSize: 36, marginBottom: 10 }}>📂</div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: "#374151", marginBottom: 4 }}>
                    {file ? file.name : "엑셀 파일을 드래그하거나 클릭하여 선택"}
                  </div>
                  <div style={{ fontSize: 12, color: "#9CA3AF" }}>.xlsx 형식, 최대 50MB</div>
                </div>
                {file && !uploadResult && (
                  <button style={{ ...S.btnPrimary, marginTop: 12 }}
                    onClick={doUpload} disabled={uploading}>
                    {uploading ? "업로드 중..." : "업로드 시작"}
                  </button>
                )}
                {uploadResult && (
                  <div style={S.successBox}>
                    📊 파일 업로드 완료! AI 분석을 시작합니다.
                  </div>
                )}
              </div>
            </div>

            <div style={S.card}>
              <div style={S.cardHeader}>
                <span style={S.cardTitle}>② AI 분석 실행</span>
                {done && <span style={{ ...S.badge, background: "#D1FAE5", color: "#065F46" }}>완료</span>}
              </div>
              <div style={S.cardBody}>
                {!running && !done && (
                  <>
                    <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 16 }}>
                      파일 업로드 시 자동으로 분석이 시작됩니다.
                    </p>
                    <button style={{ ...S.btnPrimary, opacity: 0.5 }} disabled>
                      업로드 후 자동 시작
                    </button>
                  </>
                )}
                {(running || done) && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {STEPS.map((s, i) => {
                      const isDone = step >= i;
                      const isRun  = step === i && running;
                      return (
                        <div key={s} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
                          <div style={{
                            width: 24, height: 24, borderRadius: "50%", display: "flex",
                            alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600,
                            background: isDone ? "#D1FAE5" : isRun ? "#DBEAFE" : "#F3F4F6",
                            color: isDone ? "#065F46" : isRun ? "#1D4ED8" : "#9CA3AF",
                          }}>
                            {isDone ? "✓" : i + 1}
                          </div>
                          <span style={{ color: isDone ? "#111827" : isRun ? "#1D4ED8" : "#9CA3AF", fontWeight: isDone || isRun ? 500 : 400 }}>
                            {s}
                          </span>
                          {isRun && <span style={{ fontSize: 11, color: "#1D4ED8" }}>처리 중...</span>}
                        </div>
                      );
                    })}
                    {done && (
                      <div style={{ ...S.successBox, marginTop: 8 }}>
                        🎉 분석 완료! <strong>FAQ 추천</strong> 탭에서 결과를 확인하세요.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div style={S.card}>
            <div style={S.cardHeader}><span style={S.cardTitle}>분석 이력</span></div>
            <div style={{ padding: 0 }}>
              {history.length === 0
                ? <div style={{ padding: 16, fontSize: 12, color: "#9CA3AF" }}>이력 없음</div>
                : history.map((r, i) => (
                  <div key={i} style={{ padding: "12px 16px", borderBottom: "1px solid #F3F4F6", fontSize: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <span style={{ fontFamily: "monospace", color: "#374151" }}>#{r.analysisId}</span>
                      <span style={{
                        fontSize: 10, fontWeight: 500, padding: "2px 8px", borderRadius: 10,
                        background: r.status === "COMPLETED" ? "#D1FAE5" : "#FDECEA",
                        color: r.status === "COMPLETED" ? "#065F46" : "#B91C1C",
                      }}>{r.status}</span>
                    </div>
                    <div style={{ color: "#6B7280" }}>{r.fileName}</div>
                    <div style={{ color: "#9CA3AF", marginTop: 2 }}>{r.period}</div>
                  </div>
                ))
              }
            </div>
          </div>
        </div>
      )}

      {/* ── 탭 2: 시각화 ── */}
      {tab === "visual" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={S.card}>
            <div style={S.cardHeader}>
              <span style={S.cardTitle}>클러스터링 시각화 (UMAP)</span>
            </div>
            <div style={S.cardBody}>
              {!analyzeResult ? (
                <div style={{ textAlign: "center", color: "#9CA3AF", padding: 40 }}>
                  분석을 먼저 실행해주세요.
                </div>
              ) : (
                <ClusterScatterPlot
                  points={analyzeResult.clusteringView?.points || []}
                  clusterNames={analyzeResult.clusteringView?.clusterNames || []}
                />
              )}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={S.card}>
              <div style={S.cardHeader}><span style={S.cardTitle}>응답 유형 비교</span></div>
              <div style={S.cardBody}>
                {analyzeResult ? (() => {
                  const total = analyzeResult.systemStatus?.totalLogCount || 1;
                  const correct = analyzeResult.systemStatus?.samplingStatus?.correct || 0;
                  const unanswered = analyzeResult.systemStatus?.samplingStatus?.unanswered || 0;
                  const answeredPct = ((correct / total) * 100).toFixed(1);
                  const unansweredPct = ((unanswered / total) * 100).toFixed(1);
                  return (
                    <div>
                      <div style={{ marginBottom: 20 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}>
                          <span style={{ fontWeight: 500 }}>신규 데이터</span>
                          <span style={{ color: "#43A047", fontWeight: 600 }}>답변율 {answeredPct}%</span>
                        </div>
                        <div style={{ height: 24, background: "#F3F4F6", borderRadius: 6, overflow: "hidden", display: "flex" }}>
                          <div style={{ width: `${answeredPct}%`, background: "#43A047", borderRadius: "6px 0 0 6px", transition: "width .6s" }} />
                          <div style={{ width: `${unansweredPct}%`, background: "#EF9F27" }} />
                        </div>
                        <div style={{ display: "flex", gap: 12, fontSize: 11, color: "#6B7280", marginTop: 4 }}>
                          <span>🔵 답변 {answeredPct}%</span>
                          <span>🟡 미답변 {unansweredPct}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })() : <div style={{ color: "#9CA3AF", fontSize: 12 }}>데이터 없음</div>}
              </div>
            </div>

            <div style={S.card}>
              <div style={S.cardHeader}><span style={S.cardTitle}>분석 결과 요약</span></div>
              <div style={S.cardBody}>
                {[
                  { label: "총 로그 수", value: `${analyzeResult?.systemStatus?.totalLogCount?.toLocaleString() || 0}건`, color: "#111827" },
                  { label: "예상 해소 건수", value: `${analyzeResult?.performanceMetrics?.resolvedCountByAI?.toLocaleString() || 0}건`, color: "#43A047" },
                  { label: "예상 정확도 향상", value: `+${analyzeResult?.performanceMetrics?.predictedAccuracyGain || 0}%`, color: "#1565C0" },
                  { label: "FAQ 후보 생성 수", value: `${candidates.length}개`, color: "#1565C0" },
                ].map((r) => (
                  <div key={r.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #F3F4F6", fontSize: 13 }}>
                    <span style={{ color: "#6B7280" }}>{r.label}</span>
                    <strong style={{ color: r.color }}>{r.value}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 탭 3: FAQ 추천 ── */}
      {tab === "recommend" && (
        <div>
          {candidates.length === 0 ? (
            <div style={{ ...S.card, ...S.cardBody, textAlign: "center", padding: 48, color: "#9CA3AF" }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>🔍</div>
              <div>분석을 먼저 실행해주세요.</div>
            </div>
          ) : (
            candidates.map((c) => (
              <div key={c.candidateId} style={{ ...S.card, marginBottom: 12, padding: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#111827", marginBottom: 4 }}>{c.standardQuestion}</div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 12 }}>
                      <span style={{ color: "#9CA3AF" }}>매칭 {c.occurrenceCount}건</span>
                    </div>
                  </div>
                  {c.reviewStatus === "PENDING" ? (
                    <div style={{ display: "flex", gap: 6 }}>
                      <button style={S.btnAccept} onClick={() => handleCandidate(c.candidateId, "ACCEPTED")}>✓ 승인</button>
                      <button style={S.btnReject} onClick={() => handleCandidate(c.candidateId, "REJECTED")}>✗ 반려</button>
                    </div>
                  ) : (
                    <span style={{
                      fontSize: 12, fontWeight: 500, padding: "4px 12px", borderRadius: 20,
                      background: c.reviewStatus === "ACCEPTED" ? "#D1FAE5" : "#FDECEA",
                      color: c.reviewStatus === "ACCEPTED" ? "#065F46" : "#B91C1C",
                    }}>
                      {c.reviewStatus === "ACCEPTED" ? "✅ 승인됨" : "❌ 반려됨"}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.6, marginBottom: 10 }}>{c.answerDraft}</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {(c.synonyms || []).map((s, i) => (
                    <span key={i} style={{
                      fontSize: 11, padding: "2px 8px",
                      background: s.type === "TYPO" ? "#FEF3C7" : "#EFF8FF",
                      color: s.type === "TYPO" ? "#92400E" : "#1565C0",
                      borderRadius: 12,
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
            ))
          )}
        </div>
      )}
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
  card:        { background: "#fff", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,.08)", border: "1px solid rgba(0,0,0,.06)" },
  cardHeader:  { padding: "14px 20px", borderBottom: "1px solid #F3F4F6", display: "flex", alignItems: "center", justifyContent: "space-between" },
  cardTitle:   { fontSize: 14, fontWeight: 600, color: "#111827" },
  cardBody:    { padding: 20 },
  badge:       { fontSize: 11, fontWeight: 500, padding: "2px 9px", borderRadius: 20, background: "#DBEAFE", color: "#1E40AF" },
  dropzone:    { border: "2px dashed #D1D5DB", borderRadius: 12, padding: "32px 20px", textAlign: "center", cursor: "pointer", transition: "all .18s", background: "#fff" },
  dropzoneDrag:{ borderColor: "#1565C0", background: "#EFF8FF" },
  btnPrimary:  { padding: "10px 20px", background: "#1565C0", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" },
  btnAccept:   { padding: "6px 14px", background: "#D1FAE5", color: "#065F46", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" },
  btnReject:   { padding: "6px 14px", background: "#FDECEA", color: "#B91C1C", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" },
  successBox:  { marginTop: 10, padding: "10px 14px", background: "#D1FAE5", borderRadius: 8, fontSize: 13, color: "#065F46" },
};