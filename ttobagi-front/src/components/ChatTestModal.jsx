import { useState } from "react";

const SAMPLE = ["7호선 에어컨 너무 더워요", "유실물 신고하고 싶어요", "강남역 에스컬레이터 고장", "수유실 어디 있어요?", "환승 할인 어떻게 받아요?"];

// 간이 룰 기반 응답 시뮬레이터
function getReply(q) {
  if (/더워|추워|냉방|에어컨|온도/.test(q)) return { text: "냉방 민원을 접수하시겠어요? 탑승 칸 번호를 알려주세요.", answered: true };
  if (/유실물|분실|잃어버/.test(q))          return { text: "유실물센터(02-6110-1122)로 연락하시거나 홈페이지를 이용해 주세요.", answered: true };
  if (/에스컬레이터|엘리베이터|고장/.test(q)) return { text: "시설물 고장 신고는 역무원에게 직접 전달하거나 고객센터(1577-1234)로 신고해 주세요.", answered: true };
  if (/수유|아기|유아/.test(q))              return { text: "수유실은 서울역, 강남역, 잠실역 등 주요 역사에 설치되어 있습니다.", answered: true };
  if (/환승|할인|요금/.test(q))             return { text: "교통카드 이용 시 환승 할인이 자동 적용됩니다.", answered: true };
  return { text: "죄송합니다. 해당 질문에 답변드리기 어렵습니다.", answered: false };
}

export default function ChatTestModal({ onClose }) {
  const [messages, setMessages] = useState([
    { role: "bot", text: "안녕하세요! 또타24입니다. 무엇이든 물어보세요 🚇", answered: true },
  ]);
  const [input, setInput] = useState("");

  const send = (q) => {
    const text = q || input.trim();
    if (!text) return;
    setInput("");
    const reply = getReply(text);
    setMessages((prev) => [
      ...prev,
      { role: "user", text },
      { role: "bot", ...reply },
    ]);
  };

  return (
    <div style={S.overlay}>
      <div style={S.modal}>
        {/* 헤더 */}
        <div style={S.header}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 24 }}>🤖</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>또타24 챗봇 테스트</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,.6)" }}>실제 응답 품질 확인</div>
            </div>
          </div>
          <button style={S.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* 샘플 질문 */}
        <div style={S.samples}>
          {SAMPLE.map((s) => (
            <span key={s} style={S.sampleChip} onClick={() => send(s)}>{s}</span>
          ))}
        </div>

        {/* 대화 영역 */}
        <div style={S.messages}>
          {messages.map((m, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: m.role === "user" ? "flex-end" : "flex-start", marginBottom: 10 }}>
              <div style={{ ...S.bubble, ...(m.role === "user" ? S.bubbleUser : m.answered ? S.bubbleBot : S.bubbleNo) }}>
                {m.text}
              </div>
              {m.role === "bot" && (
                <span style={{ fontSize: 10, color: m.answered ? "#43A047" : "#E53935", marginTop: 3, paddingLeft: 4 }}>
                  {m.answered ? "✅ 답변 완료" : "❌ 미답변"}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* 입력창 */}
        <div style={S.inputWrap}>
          <input style={S.input} placeholder="질문을 입력하세요..."
            value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()} />
          <button style={S.sendBtn} onClick={() => send()}>전송</button>
        </div>
      </div>
    </div>
  );
}

const S = {
  overlay:    { position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 999, display: "flex", alignItems: "flex-end", justifyContent: "flex-end", padding: 24 },
  modal:      { width: 400, height: 600, background: "#fff", borderRadius: 20, display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,.3)" },
  header:     { background: "linear-gradient(135deg, #0D3B7A, #1976D2)", padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" },
  closeBtn:   { background: "rgba(255,255,255,.2)", border: "none", color: "#fff", width: 28, height: 28, borderRadius: "50%", cursor: "pointer", fontSize: 13 },
  samples:    { padding: "10px 14px", display: "flex", gap: 6, flexWrap: "wrap", borderBottom: "1px solid #F3F4F6" },
  sampleChip: { fontSize: 11, padding: "4px 10px", background: "#EFF8FF", color: "#1565C0", borderRadius: 12, cursor: "pointer", border: "1px solid #BFDBFE" },
  messages:   { flex: 1, overflowY: "auto", padding: "14px 16px", display: "flex", flexDirection: "column" },
  bubble:     { maxWidth: "78%", padding: "9px 13px", borderRadius: 14, fontSize: 13, lineHeight: 1.55 },
  bubbleUser: { background: "#1565C0", color: "#fff", borderBottomRightRadius: 4 },
  bubbleBot:  { background: "#F3F4F6", color: "#111827", borderBottomLeftRadius: 4 },
  bubbleNo:   { background: "#FDECEA", color: "#B91C1C", borderBottomLeftRadius: 4 },
  inputWrap:  { display: "flex", gap: 8, padding: "12px 14px", borderTop: "1px solid #F3F4F6" },
  input:      { flex: 1, height: 40, padding: "0 14px", border: "1.5px solid #D1D5DB", borderRadius: 10, fontSize: 13, fontFamily: "inherit", outline: "none" },
  sendBtn:    { padding: "0 18px", background: "#1565C0", color: "#fff", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" },
};