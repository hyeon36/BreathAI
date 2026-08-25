import { useState } from "react";
import { authApi } from "../api/index.js";

export default function LoginPage({ onLogin, setPage }) {
  const [email, setEmail]       = useState("");
  const [pw, setPw]             = useState("");
  const [remember, setRemember] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const submit = async () => {
    if (!email || !pw) { setError("이메일과 비밀번호를 입력해주세요."); return; }
    setLoading(true);
    setError("");
    try {
      const res = await authApi.login(email, pw);
      if (res.success && res.data?.accessToken) {
        localStorage.setItem("token", res.data.accessToken);
        localStorage.setItem("refreshToken", res.data.refreshToken);
        const meRes = await authApi.getMe(res.data.accessToken);
        onLogin(meRes.data);
      } else {
        setError("이메일 또는 비밀번호가 올바르지 않습니다.");
      }
    } catch {
      setError("서버 연결에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={S.page}>
      {/* ── 배경 도형들 ── */}
      <div style={S.bgCircle1} />
      <div style={S.bgCircle2} />
      <div style={S.bgCircle3} />
      <div style={S.bgCircle4} />
      <div style={S.bgDot1} />
      <div style={S.bgDot2} />
      <div style={S.bgDot3} />
      <div style={S.bgRect1} />
      <div style={S.bgRect2} />

      {/* ── 가운데 카드 ── */}
      <div style={S.card}>
        {/* 왼쪽 — 설명 */}
        <div style={S.cardLeft}>
          <div style={S.cardLeftInner}>
            <div style={S.cardCircle1} />
            <div style={S.cardCircle2} />
            <div style={S.cardRect1} />
            <div style={S.cardRect2} />
            <div style={{ position: "relative", zIndex: 2 }}>
              <div style={S.leftTitle}>또타24<br />현행화 시스템</div>
              <div style={S.leftSub}>
                AI 기반 미답변 분석을 통해<br />
                챗봇 학습데이터를<br />
                자동으로 현행화합니다.
              </div>
            </div>
          </div>
        </div>

        {/* 오른쪽 — 로그인 폼 */}
        <div style={S.cardRight}>
          {/* 로고 */}
          <div style={S.logoWrap}>
            <span style={{ fontSize: 26 }}>🚇</span>
          </div>

          <div style={S.welcome}>반갑습니다!</div>
          <div style={S.desc}>운영자 계정으로 로그인하세요.</div>

          {/* 이메일 */}
          <div style={S.inputWrap}>
            <span style={S.inputIcon}>✉️</span>
            <input style={S.input} type="email"
              placeholder="이메일 주소"
              value={email} onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()} />
          </div>

          {/* 비밀번호 */}
          <div style={S.inputWrap}>
            <span style={S.inputIcon}>🔒</span>
            <input style={S.input} type="password"
              placeholder="비밀번호"
              value={pw} onChange={(e) => setPw(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()} />
          </div>

          {/* Remember me + 비번 찾기 */}
          <div style={S.row}>
            <label style={S.rememberLabel}>
              <input type="checkbox" checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                style={{ marginRight: 6, accentColor: "#1565C0" }} />
              로그인 상태 유지
            </label>
            <span style={S.link} onClick={() => setPage("reset")}>
              비밀번호 찾기
            </span>
          </div>

          {error && <div style={S.error}>{error}</div>}

          {/* 로그인 버튼 */}
          <button style={{ ...S.btn, opacity: loading ? 0.7 : 1 }}
            onClick={submit} disabled={loading}>
            {loading ? "로그인 중..." : "로그인"}
          </button>

          {/* 구분선 */}
          <div style={S.divider}>
            <div style={S.dividerLine} />
            <span style={S.dividerText}>또는</span>
            <div style={S.dividerLine} />
          </div>

          {/* 회원가입 */}
          <div style={{ textAlign: "center", fontSize: 13 }}>
            <span style={{ color: "#6B7280", marginRight: 4 }}>계정이 없으신가요?</span>
            <span style={S.link} onClick={() => setPage("signup")}>회원가입</span>
          </div>

          {/* 관리자 권한 부여 */}
          <div style={{ textAlign: "center", fontSize: 12, marginTop: 8 }}>
            <span style={{ color: "#9CA3AF", marginRight: 4 }}>관리자 권한이 필요하신가요?</span>
            <span style={S.link} onClick={() => setPage("promote")}>권한 부여</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const S = {
  // ── 전체 배경 ──
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #1565C0 0%, #42A5F5 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
  },

  // ── 가운데 카드 ──
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

  // 카드 왼쪽
  cardLeft: {
    width: 320,
    background: "linear-gradient(160deg, #0D47A1 0%, #1976D2 100%)",
    position: "relative",
    overflow: "hidden",
    flexShrink: 0,
  },
  cardLeftInner: {
    height: "100%",
    display: "flex",
    alignItems: "flex-end",
    padding: "40px 36px",
    position: "relative",
  },
  //cardCircle1: { position: "absolute", top: -40, left: -40, width: 160, height: 160, borderRadius: "50%", background: "rgba(255,255,255,0.1)" },
  //cardCircle2: { position: "absolute", top: 30, right: -30, width: 100, height: 100, borderRadius: "50%", background: "rgba(255,255,255,0.07)" },
  //cardRect1:   { position: "absolute", top: 60, left: 50, width: 24, height: 80, borderRadius: 12, background: "rgba(255,255,255,0.15)", transform: "rotate(15deg)" },
  //cardRect2:   { position: "absolute", top: 50, left: 90, width: 18, height: 60, borderRadius: 9,  background: "rgba(255,255,255,0.1)",  transform: "rotate(-10deg)" },

  leftTitle: { fontSize: 28, fontWeight: 800, color: "#fff", lineHeight: 1.25, marginBottom: 12, letterSpacing: "-0.5px" },
  leftSub:   { fontSize: 13, color: "rgba(255,255,255,0.75)", lineHeight: 1.8 },

  // 카드 오른쪽
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
    boxShadow: "0 2px 8px rgba(21,101,192,0.15)",
  },
  welcome: { fontSize: 20, fontWeight: 700, color: "#111827", marginBottom: 4 },
  desc:    { fontSize: 12, color: "#9CA3AF", marginBottom: 24, lineHeight: 1.6 },

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

  row: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 },
  rememberLabel: { display: "flex", alignItems: "center", fontSize: 12, color: "#6B7280", cursor: "pointer" },
  link: { fontSize: 12, color: "#1565C0", cursor: "pointer", fontWeight: 500 },
  error: { fontSize: 12, color: "#DC2626", marginBottom: 12, textAlign: "center" },

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
};