const BASE_URL = "http://localhost:8080";

const fetchApi = async (method, path, body = null, token = null, isFormData = false) => {
  const headers = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (!isFormData) headers["Content-Type"] = "application/json";

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: isFormData ? body : body ? JSON.stringify(body) : null,
  });

  return res.json();
};

// ── 회원 ──────────────────────────────────────────────────
export const authApi = {
  // POST /api/v1/auth/login
  login: (email, password) =>
    fetchApi("POST", "/api/v1/auth/login", { email, password }),

  // POST /api/v1/auth/signup
  signup: (email, password, name) =>
    fetchApi("POST", "/api/v1/auth/signup", { email, password, name }),

  // POST /api/v1/auth/password/reset
  resetPassword: (email) =>
    fetchApi("POST", "/api/v1/auth/password/reset", { email }),

  // GET /api/v1/auth/me
  getMe: (token) =>
    fetchApi("GET", "/api/v1/auth/me", null, token),

  // PATCH /api/v1/auth/me
  updateMe: (body, token) =>
    fetchApi("PATCH", "/api/v1/auth/me", body, token),

  // DELETE /api/v1/auth/quit
  quit: (token) =>
    fetchApi("DELETE", "/api/v1/auth/quit", null, token),

  // POST /api/v1/auth/reissue
  reissue: (refreshToken) =>
    fetchApi("POST", "/api/v1/auth/reissue", { refreshToken }),

  // PATCH /api/v1/auth/promote
  promote: (email, adminCode, token) =>
  fetchApi("PATCH", "/api/v1/auth/promote", { email, adminCode }, token),
};

// ── 대시보드 ──────────────────────────────────────────────
export const dashApi = {
  // GET /api/v1/dashboard/usage?year=2026&month=4
  getUsage: (year, month, token) =>
    fetchApi("GET", `/api/v1/dashboard/usage?year=${year}&month=${month}`, null, token),

  // POST /api/v1/dashboard/analyze/upload (업로드 + 분석 통합)
  uploadAndAnalyze: (formData, token) =>
    fetchApi("POST", "/api/v1/dashboard/analyze/upload", formData, token, true),

  // GET /api/v1/dashboard/analyze/{analysisId}
  getAnalysisStatus: (analysisId, token) =>
    fetchApi("GET", `/api/v1/dashboard/analyze/${analysisId}`, null, token),

  // GET /api/v1/dashboard/analyze/{analysisId}/result
  getFileAnalyzeResult: (analysisId, token) =>
    fetchApi("GET", `/api/v1/dashboard/analyze/${analysisId}/result`, null, token),

  // GET /api/v1/dashboard/analyze/results?startDate=...&endDate=...
  getAnalyzeResult: (startDate, endDate, token) =>
    fetchApi("GET", `/api/v1/dashboard/analyze/results?startDate=${startDate}&endDate=${endDate}`, null, token),

  // GET /api/v1/dashboard/analyze/history
  getAnalysisHistory: (page = 0, size = 10, token) =>
    fetchApi("GET", `/api/v1/dashboard/analyze/history?page=${page}&size=${size}`, null, token),

  // GET /api/v1/dashboard/analyze/stream/{analysisId} (SSE)
  streamAnalysisStatus: (analysisId, token, onMessage, onError) => {
    const eventSource = new EventSource(
      `${BASE_URL}/api/v1/dashboard/analyze/stream/${analysisId}`,
    );

    eventSource.onmessage = (e) => onMessage(e.data);

    eventSource.onerror = () => {
      eventSource.close();
      // SSE 끊기면 폴링으로 fallback
      if (onError) onError();
    };

    return eventSource;
  },
};

// ── FAQ ───────────────────────────────────────────────────
export const faqApi = {
  // GET /api/v1/faq?page=0&size=10
  getList: (page = 0, size = 10, token) =>
    fetchApi("GET", `/api/v1/faq?page=${page}&size=${size}`, null, token),

  // GET /api/v1/faq/{faqId}
  getOne: (faqId, token) =>
    fetchApi("GET", `/api/v1/faq/${faqId}`, null, token),

  // GET /api/v1/faq/recommendations/{analysisId}
  getCandidates: (analysisId, token) =>
    fetchApi("GET", `/api/v1/faq/recommendations/${analysisId}`, null, token),

  // POST /api/v1/faq/apply
  apply: (body, token) =>
    fetchApi("POST", "/api/v1/faq/apply", body, token),

  // PATCH /api/v1/faq/{faqId}
  update: (faqId, body, token) =>
    fetchApi("PATCH", `/api/v1/faq/${faqId}`, body, token),

  // DELETE /api/v1/faq/{faqId}
  remove: (faqId, token) =>
    fetchApi("DELETE", `/api/v1/faq/${faqId}`, null, token),

  // GET /api/v1/faq/history/{faqId}
  getHistory: (faqId, token) =>
    fetchApi("GET", `/api/v1/faq/history/${faqId}`, null, token),
};