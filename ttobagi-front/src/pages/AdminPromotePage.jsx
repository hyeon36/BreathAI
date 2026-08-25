import { useState } from "react";
import { authApi } from "../api/index.js";

export default function AdminPromotePage({ setPage }) {
  const [email, setEmail]         = useState("");
  const [adminCode, setAdminCode] = useState("");
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [success, setSuccess]     = useState("");

  const submit = async () => {
    if (!email || !adminCode) { setError("이메일과 관리자 인증 코드를 입력해주세요."); return; }
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const token = localStorage.getItem("token");
      const res = await authApi.promote(email, adminCode, token);
      if (res.success) {
        setSuccess("관리자 권한이 성공적으로 부여되었습니다.");
        setEmail("");
        setAdminCode("");
      } else {
        const errMsg =
          res.code === "USER_NOT_FOUND"
            ? "해당 이메일로 등록된 계정이 없습니다."
            : res.code === "INVALID_ADMIN_CODE"
            ? "관리자 인증 코드가 올바르지 않습니다."
            : "권한 부여에 실패했습니다.";
        setError(errMsg);
      }
    } catch {
      setError("서버 연결에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={S.page}>
      <div style={S.bgCircle1} />
      <div style={S.bgCircle2} />

      <div style={S.card}>
        {/* 왼쪽 */}
        <div style={S.cardLeft}>
          <div style={{ position: "relative", zIndex: 2 }}>
            <div style={S.leftTitle}>또타24<br />현행화 시스템</div>
            <div style={S.leftSub}>
              관리자 권한 부여는<br />
              인증된 운영자만<br />
              사용할 수 있습니다.
            </div>
          </div>
        </div>

        {/* 오른쪽 */}
        <div style={S.cardRight}>
          <div style={S.logoWrap}>🔑</div>
          <div style={S.welcome}>관리자 권한 부여</div>
          <div style={S.desc}>대상 계정의 이메일과 관리자 인증 코드를 입력하세요.</div>

          <div style={S.notice}>
            ⚠️ 이 페이지는 운영자 전용입니다.<br />
            관리자 인증 코드는 시스템 관리자에게 문의하세요.
          </div>

          <div style={S.inputWrap}>
            <span style={S.inputIcon}>✉️</span>
            <input
              style={S.input}
              type="email"
              placeholder="권한을 부여할 이메일 주소"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
            />
          </div>

          <div style={S.inputWrap}>
            <span style={S.inputIcon}>🔒</span>
            <input
              style={S.input}
              type="password"
              placeholder="관리자 인증 코드"
              value={adminCode}
              onChange={(e) => setAdminCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
            />
          </div>

          {error   && <div style={S.error}>{error}</div>}
          {success && <div style={S.success}>✅ {success}</div>}

          <button
            style={{ ...S.btn, opacity: loading ? 0.7 : 1 }}
            onClick={submit}
            disabled={loading}
          >
            {loading ? "처리 중..." : "권한 부여"}
          </button>

          <div style={S.divider}>
            <div style={S.dividerLine} />
            <span style={S.dividerText}>또는</span>
            <div style={S.dividerLine} />
          </div>

          <div style={{ textAlign: "center", fontSize: 13 }}>
            <span style={{ color: "#6B7280", marginRight: 4 }}>운영자 계정이 있으신가요?</span>
            <span style={S.link} onClick={() => setPage("login")}>로그인으로 돌아가기</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const S = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #1565C0 0%, #42A5F5 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
  },
  bgCircle1: {
    position: "absolute", top: -80, left: -80,
    width: 300, height: 300, borderRadius: "50%",
    background: "rgba(255,255,255,0.07)",
  },
  bgCircle2: {
    position: "absolute", bottom: -60, right: -40,
    width: 200, height: 200, borderRadius: "50%",
    background: "rgba(255,255,255,0.05)",
  },
  card: {
    display: "flex",
    width: 820,
    minHeight: 500,
    borderRadius: 24,
    overflow: "hidden",
    boxShadow: "0 24px 60px rgba(0,0,0,0.2)",
    position: "relative",
    zIndex: 10,
  },
  cardLeft: {
    width: 320,
    background: "linear-gradient(160deg, #0D47A1 0%, #1976D2 100%)",
    position: "relative",
    overflow: "hidden",
    flexShrink: 0,
    display: "flex",
    alignItems: "flex-end",
    padding: "40px 36px",
  },
  leftTitle: { fontSize: 28, fontWeight: 800, color: "#fff", lineHeight: 1.25, marginBottom: 12, letterSpacing: "-0.5px" },
  leftSub:   { fontSize: 13, color: "rgba(255,255,255,0.75)", lineHeight: 1.8 },
  cardRight: {
    flex: 1,
    background: "#fff",
    padding: "44px 40px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
  },
  logoWrap: {
    width: 56, height: 56,
    background: "#EFF8FF",
    borderRadius: 14,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
    fontSize: 26,
    boxShadow: "0 2px 8px rgba(21,101,192,0.15)",
  },
  welcome: { fontSize: 20, fontWeight: 700, color: "#111827", marginBottom: 4 },
  desc:    { fontSize: 12, color: "#9CA3AF", marginBottom: 16, lineHeight: 1.6 },
  notice: {
    background: "#EFF8FF",
    border: "1px solid #BFDBFE",
    borderRadius: 8,
    padding: "10px 14px",
    marginBottom: 16,
    fontSize: 12,
    color: "#1565C0",
    lineHeight: 1.6,
  },
  inputWrap: {
    display: "flex", alignItems: "center",
    background: "#F9FAFB",
    border: "1.5px solid #E5E7EB",
    borderRadius: 10,
    padding: "0 14px",
    marginBottom: 12,
  },
  inputIcon: { fontSize: 13, marginRight: 10, opacity: 0.4 },
  input: {
    flex: 1, height: 44, border: "none", outline: "none",
    fontSize: 13, fontFamily: "inherit",
    background: "transparent", color: "#111827",
  },
  error:   { fontSize: 12, color: "#DC2626", marginBottom: 12, textAlign: "center" },
  success: {
    fontSize: 12, color: "#059669", marginBottom: 12,
    textAlign: "center", background: "#D1FAE5",
    padding: "8px 12px", borderRadius: 8,
  },
  btn: {
    width: "100%", height: 46,
    background: "linear-gradient(135deg, #1565C0, #42A5F5)",
    color: "#fff", border: "none", borderRadius: 10,
    fontSize: 14, fontWeight: 600, cursor: "pointer",
    fontFamily: "inherit",
    boxShadow: "0 4px 14px rgba(21,101,192,0.35)",
  },
  divider:     { display: "flex", alignItems: "center", gap: 10, margin: "18px 0" },
  dividerLine: { flex: 1, height: 1, background: "#E5E7EB" },
  dividerText: { fontSize: 11, color: "#9CA3AF" },
  link: { fontSize: 12, color: "#1565C0", cursor: "pointer", fontWeight: 500 },
};
