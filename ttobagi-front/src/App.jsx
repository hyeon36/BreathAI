import { useState } from "react";
import LoginPage      from "./pages/LoginPage.jsx";
import SignupPage     from "./pages/SignupPage.jsx";
import ResetPage      from "./pages/ResetPage.jsx";
import AdminPromotePage from "./pages/AdminPromotePage.jsx";
import DashboardPage  from "./pages/DashboardPage.jsx";
import Sidebar        from "./components/Sidebar.jsx";
import AnalyzePage from "./pages/AnalyzePage.jsx";
import FaqPage from "./pages/FaqPage.jsx";
import AccountPage from "./pages/AccountPage.jsx";

export default function App() {
  const [authPage, setAuthPage] = useState("login");
  const [user, setUser]         = useState(null);
  const [page, setPage]         = useState("dashboard");

  if (user) {
    return (
      <div style={{ display: "flex" }}>
        <Sidebar currentPage={page} setPage={setPage} />
        <div style={{ marginLeft: 220, flex: 1, minHeight: "100vh", background: "#F9FAFB" }}>
          {page === "dashboard" && <DashboardPage />}
          {page === "analyze" && <AnalyzePage />}          
          {page === "faq" && <FaqPage />}
          {page === "account" && <AccountPage user={user} onLogout={() => setUser(null)} />}
        </div>
      </div>
    );
  }

  return (
    <>
      {authPage === "login"  && <LoginPage  onLogin={setUser} setPage={setAuthPage} />}
      {authPage === "signup" && <SignupPage setPage={setAuthPage} />}
      {authPage === "reset"  && <ResetPage  setPage={setAuthPage} />}
      {authPage === "promote" && <AdminPromotePage setPage={setAuthPage} />}
    </>
  );
}