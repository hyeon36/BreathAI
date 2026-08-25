import { useState } from "react";
import { authApi } from "../api/index.js";

export default function ResetPage({ setPage }) {
  const [email, setEmail] = useState("");
  const [sent, setSent]   = useState(false);

  return (
    <div style={S.page}>
      <div style={S.left}>
        <span style={{ fontSize: 52 }}>🚇</span>
        <h1 style={S.brand}>비밀번호 찾기</h1>
        <p style={S.tagline}>등록된 이메일로 재설정 링크를 발송합니다.</p>
      </div>

      <div style={S.right}>
        <div style={S.box}>
          <h2 style={S.title}>비밀번호 찾기</h2>
          <p style={S.desc}>가입한 이메일을 입력하면 재설정 링크를 발송합니다.</p>

          <label style={S.label}>이메일</label>
          <input style={S.input} type="email"
            placeholder="admin@seoulmetro.co.kr"
            value={email} onChange={(e) => setEmail(e.target.value)} />

          {sent && <p style={{ fontSize: 12, color: "#16A34A", marginTop: 8 }}>✅ 이메일을 발송했습니다. 메일함을 확인해주세요.</p>}

          <button style={{ ...S.btn, marginTop: 20 }} onClick={async () => {
            if (!email) return;
            try {
              await authApi.resetPassword(email);
              setSent(true);
            } catch {
              alert("이메일 발송에 실패했습니다.");
            }
          }}>
            재설정 링크 발송
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
  desc: { fontSize: 13, color: "#6B7280", marginBottom: 28 },
  label: { display: "block", fontSize: 12, fontWeight: 500, color: "#374151", marginBottom: 5 },
  input: { width: "100%", height: 44, padding: "0 14px", border: "1.5px solid #D1D5DB", borderRadius: 8, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" },
  btn: { width: "100%", height: 46, background: "#1565C0", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" },
  link: { color: "#1976D2", cursor: "pointer", textDecoration: "underline" },
};