import { useState } from "react";
import { authApi } from "../api/index.js";

export default function SignupPage({ setPage }) {
  const [email, setEmail]     = useState("");
  const [pw, setPw]           = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg]         = useState("");

  const submit = async () => {
    if (!email || !pw) { setMsg("error:모든 항목을 입력해주세요."); return; }
    if (pw !== confirm) { setMsg("error:비밀번호가 일치하지 않습니다."); return; }
    if (pw.length < 8)  { setMsg("error:비밀번호는 8자 이상이어야 합니다."); return; }
    setLoading(true);
    try {
      const res = await authApi.signup(email, pw);
      if (res.success) {
        setMsg("ok:가입 완료! 로그인 해주세요.");
        setTimeout(() => setPage("login"), 1800);
      } else {
        setMsg("error:이미 사용 중인 이메일입니다.");
      }
    } catch {
      setMsg("error:회원가입에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const isError = msg.startsWith("error:");
  const isOk    = msg.startsWith("ok:");

  return (
    <div style={S.page}>
      <div style={S.left}>
        <span style={{ fontSize: 52 }}>🚇</span>
        <h1 style={S.brand}>또타24<br />현행화 시스템</h1>
        <p style={S.tagline}>서울교통공사 운영 담당자를 위한<br />챗봇 학습데이터 관리 시스템</p>
      </div>

      <div style={S.right}>
        <div style={S.box}>
          <h2 style={S.title}>회원가입</h2>
          <p style={S.desc}>운영자 계정을 생성합니다.</p>

          {[
            { label: "이메일", type: "email", ph: "admin@seoulmetro.co.kr", val: email, set: setEmail },
            { label: "비밀번호 (8자 이상)", type: "password", ph: "영문+숫자+특수문자", val: pw, set: setPw },
            { label: "비밀번호 확인", type: "password", ph: "비밀번호 재입력", val: confirm, set: setConfirm },
          ].map((f) => (
            <div key={f.label} style={{ marginBottom: 14 }}>
              <label style={S.label}>{f.label}</label>
              <input style={S.input} type={f.type} placeholder={f.ph}
                value={f.val} onChange={(e) => f.set(e.target.value)} />
            </div>
          ))}

          {msg && (
            <p style={{ fontSize: 12, color: isError ? "#DC2626" : "#16A34A", marginTop: 4 }}>
              {msg.replace(/^(error|ok):/, "")}
            </p>
          )}

          <button style={{ ...S.btn, marginTop: 10, opacity: loading ? 0.7 : 1 }}
            onClick={submit} disabled={loading}>
            {loading ? "처리 중..." : "가입하기"}
          </button>

          <div style={{ textAlign: "center", marginTop: 16, fontSize: 13 }}>
            <span style={S.link} onClick={() => setPage("login")}>로그인으로 돌아가기</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const S = {
  page: { display: "flex", minHeight: "100vh", background: "linear-gradient(135deg, #0D3B7A 0%, #1565C0 100%)" },
  left: { flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "60px 56px", color: "#fff" },
  brand: { fontSize: 32, fontWeight: 700, lineHeight: 1.3, margin: "20px 0 16px" },
  tagline: { fontSize: 15, color: "rgba(255,255,255,0.75)", lineHeight: 1.8 },
  right: { width: 480, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 32px" },
  box: { width: "100%", maxWidth: 380 },
  title: { fontSize: 24, fontWeight: 700, color: "#111827", marginBottom: 6 },
  desc: { fontSize: 13, color: "#6B7280", marginBottom: 24 },
  label: { display: "block", fontSize: 12, fontWeight: 500, color: "#374151", marginBottom: 5 },
  input: { width: "100%", height: 44, padding: "0 14px", border: "1.5px solid #D1D5DB", borderRadius: 8, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" },
  btn: { width: "100%", height: 46, background: "#1565C0", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" },
  link: { color: "#1976D2", cursor: "pointer", textDecoration: "underline" },
};