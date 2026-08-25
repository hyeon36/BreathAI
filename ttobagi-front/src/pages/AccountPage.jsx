import { useState } from "react";
import { authApi } from "../api/index.js";

export default function AccountPage({ user, onLogout }) {
  const [tab, setTab]   = useState("info");
  const [pw, setPw]     = useState({ current: "", next: "", confirm: "" });
  const [pwMsg, setPwMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setPw((p) => ({ ...p, [k]: e.target.value }));

  const changePw = async () => {
    if (!pw.current || !pw.next || !pw.confirm) {
      setPwMsg("error:모든 항목을 입력해주세요.");
      return;
    }
    if (pw.next !== pw.confirm) {
      setPwMsg("error:새 비밀번호가 일치하지 않습니다.");
      return;
    }
    if (pw.next.length < 8) {
      setPwMsg("error:비밀번호는 8자 이상이어야 합니다.");
      return;
    }
    setLoading(true);
    const token = localStorage.getItem("token");
    const res = await authApi.updateMe({ 
      email: user.email,
      currentPassword: pw.current, 
      newPassword: pw.next 
    }, token);
    setLoading(false);
    if (res.success) {
      setPwMsg("ok:비밀번호가 변경되었습니다.");
      setPw({ current: "", next: "", confirm: "" });
      setTimeout(() => setPwMsg(""), 3000);
    } else {
      setPwMsg("error:비밀번호 변경에 실패했습니다.");
    }
  };

  const isError = pwMsg.startsWith("error:");
  const isOk    = pwMsg.startsWith("ok:");

  return (
    <div style={S.page}>
      <div style={S.pageTitle}>계정 관리</div>
      <div style={S.pageSub}>계정 정보를 확인하고 관리합니다.</div>

      {/* 탭 */}
      <div style={S.tabs}>
        {[
          { key: "info",   label: "내 정보" },
          { key: "pw",     label: "비밀번호 변경" },
          { key: "danger", label: "계정 설정" },
        ].map((t) => (
          <div key={t.key}
            style={{ ...S.tab, ...(tab === t.key ? S.tabActive : {}), ...(t.key === "danger" && tab === t.key ? { color: "#E53935" } : {}) }}
            onClick={() => setTab(t.key)}>
            {t.label}
          </div>
        ))}
      </div>

      {/* ── 내 정보 ── */}
      {tab === "info" && (
        <div style={{ maxWidth: 520 }}>
          <div style={S.card}>
            <div style={S.cardHeader}><span style={S.cardTitle}>프로필</span></div>
            <div style={S.cardBody}>
              {/* 아바타 */}
              <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 24 }}>
                <div style={S.avatar}>
                  {user?.email?.[0]?.toUpperCase() || "A"}
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 4 }}>
                    {user?.name || "운영자"}
                  </div>
                  <div style={{ fontSize: 13, color: "#6B7280", marginBottom: 6 }}>
                    {user?.email || "admin@seoulmetro.co.kr"}
                  </div>
                  <span style={S.roleBadge}>
                    {user?.role === "ADMIN" ? "👑 관리자" : "🔧 운영자"}
                  </span>
                </div>
              </div>

              {/* 정보 테이블 */}
              {[
                { label: "이메일",   value: user?.email || "admin@seoulmetro.co.kr" },
                { label: "이름",     value: user?.name || "운영자" },
                { label: "권한",     value: user?.role === "ADMIN" ? "관리자 (ADMIN)" : "운영자 (USER)" },
                { label: "계정 상태", value: "활성" },
              ].map((r) => (
                <div key={r.label} style={S.infoRow}>
                  <span style={S.infoLabel}>{r.label}</span>
                  <span style={S.infoValue}>{r.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── 비밀번호 변경 ── */}
      {tab === "pw" && (
        <div style={{ maxWidth: 440 }}>
          <div style={S.card}>
            <div style={S.cardHeader}><span style={S.cardTitle}>비밀번호 변경</span></div>
            <div style={S.cardBody}>
              {[
                { label: "현재 비밀번호", key: "current", ph: "현재 비밀번호 입력" },
                { label: "새 비밀번호", key: "next", ph: "6~20자, 소문자+숫자+특수문자(@$!%*?&)" },
                { label: "새 비밀번호 확인", key: "confirm", ph: "새 비밀번호 재입력" },
              ].map((f) => (
                <div key={f.key} style={{ marginBottom: 14 }}>
                  <label style={S.label}>{f.label}</label>
                  <input style={S.input} type="password"
                    placeholder={f.ph}
                    value={pw[f.key]}
                    onChange={set(f.key)} />
                </div>
              ))}

              {pwMsg && (
                <div style={{
                  fontSize: 12, marginBottom: 12, padding: "8px 12px", borderRadius: 8,
                  background: isError ? "#FDECEA" : "#D1FAE5",
                  color: isError ? "#B91C1C" : "#065F46",
                }}>
                  {pwMsg.replace(/^(error|ok):/, "")}
                </div>
              )}

              {/* 비밀번호 강도 */}
              {pw.next.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, color: "#6B7280", marginBottom: 4 }}>
                    비밀번호 강도
                  </div>
                  <div style={{ display: "flex", gap: 4 }}>
                    {[1, 2, 3, 4].map((n) => {
                      const strength =
                        pw.next.length >= 8 ? 1 : 0 +
                        /[A-Z]/.test(pw.next) ? 1 : 0 +
                        /[0-9]/.test(pw.next) ? 1 : 0 +
                        /[^A-Za-z0-9]/.test(pw.next) ? 1 : 0;
                      const colors = ["#E53935", "#EF9F27", "#43A047", "#1565C0"];
                      return (
                        <div key={n} style={{
                          flex: 1, height: 4, borderRadius: 2,
                          background: n <= (pw.next.length < 6 ? 1 : pw.next.length < 8 ? 2 : pw.next.length < 12 ? 3 : 4)
                            ? colors[pw.next.length < 6 ? 0 : pw.next.length < 8 ? 1 : pw.next.length < 12 ? 2 : 3]
                            : "#F3F4F6",
                        }} />
                      );
                    })}
                  </div>
                </div>
              )}

              <button style={{ ...S.btnPrimary, opacity: loading ? 0.7 : 1 }}
                onClick={changePw} disabled={loading}>
                {loading ? "변경 중..." : "비밀번호 변경"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 계정 설정 ── */}
      {tab === "danger" && (
        <div style={{ maxWidth: 520 }}>
          {/* 로그아웃 */}
          <div style={S.card}>
            <div style={S.cardHeader}><span style={S.cardTitle}>로그아웃</span></div>
            <div style={S.cardBody}>
              <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 16 }}>
                현재 세션에서 로그아웃합니다. 다시 로그인하면 이전 작업을 계속할 수 있습니다.
              </p>
              <button style={S.btnOutline} onClick={onLogout}>
                로그아웃
              </button>
            </div>
          </div>

          {/* 회원 탈퇴 */}
          <div style={{ ...S.card, marginTop: 16, border: "1px solid #FECACA" }}>
            <div style={{ ...S.cardHeader, borderBottom: "1px solid #FECACA" }}>
              <span style={{ ...S.cardTitle, color: "#E53935" }}>⚠️ 위험 구역</span>
            </div>
            <div style={S.cardBody}>
              <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 6 }}>
                계정을 탈퇴하면 모든 데이터가 삭제되며 복구할 수 없습니다.
              </p>
              <p style={{ fontSize: 12, color: "#E53935", marginBottom: 16 }}>
                탈퇴를 원하시면 관리자에게 문의해주세요.
              </p>
              <button style={S.btnDanger}
                onClick={() => alert("회원 탈퇴는 관리자(admin@seoulmetro.co.kr)에게 문의해주세요.")}>
                회원 탈퇴 요청
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const S = {
  page:       { padding: 28 },
  pageTitle:  { fontSize: 20, fontWeight: 700, color: "#111827", marginBottom: 4 },
  pageSub:    { fontSize: 13, color: "#6B7280", marginBottom: 20 },
  tabs:       { display: "flex", gap: 2, background: "#F3F4F6", borderRadius: 10, padding: 4, width: "fit-content", marginBottom: 24 },
  tab:        { padding: "8px 20px", borderRadius: 8, fontSize: 13, cursor: "pointer", color: "#6B7280" },
  tabActive:  { background: "#fff", color: "#1565C0", fontWeight: 600, boxShadow: "0 1px 3px rgba(0,0,0,.08)" },
  card:       { background: "#fff", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,.08)", border: "1px solid rgba(0,0,0,.06)" },
  cardHeader: { padding: "14px 20px", borderBottom: "1px solid #F3F4F6", display: "flex", alignItems: "center" },
  cardTitle:  { fontSize: 14, fontWeight: 600, color: "#111827" },
  cardBody:   { padding: 24 },
  avatar:     { width: 56, height: 56, borderRadius: "50%", background: "#1565C0", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 700, flexShrink: 0 },
  roleBadge:  { fontSize: 11, fontWeight: 500, padding: "3px 10px", borderRadius: 12, background: "#DBEAFE", color: "#1E40AF" },
  infoRow:    { display: "flex", alignItems: "center", padding: "12px 0", borderBottom: "1px solid #F3F4F6" },
  infoLabel:  { width: 100, fontSize: 12, color: "#6B7280", flexShrink: 0 },
  infoValue:  { fontSize: 13, color: "#111827", fontWeight: 500 },
  label:      { display: "block", fontSize: 12, fontWeight: 500, color: "#374151", marginBottom: 5 },
  input:      { width: "100%", height: 42, padding: "0 14px", border: "1.5px solid #D1D5DB", borderRadius: 8, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" },
  btnPrimary: { width: "100%", height: 44, background: "#1565C0", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" },
  btnOutline: { padding: "10px 24px", background: "#fff", color: "#374151", border: "1.5px solid #D1D5DB", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" },
  btnDanger:  { padding: "10px 24px", background: "#FDECEA", color: "#B91C1C", border: "1.5px solid #FECACA", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" },
};