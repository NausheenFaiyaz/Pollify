import { useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import "./App.css";
import Navbar from "./ui/Navbar";
import ProtectedRoute from "./ui/ProtectedRoute";
import AuthCallbackPage from "./pages/AuthCallbackPage";
import CreatePollPage from "./pages/CreatePollPage";
import DashboardPage from "./pages/DashboardPage";
import HomePage from "./pages/HomePage";
import PollAnalyticsPage from "./pages/PollAnalyticsPage";
import PublicPollPage from "./pages/PublicPollPage";
import { tryRefreshAccessToken } from "./api/client";
import { getToken, isTokenExpired } from "./auth/oidc";

function App() {
  const location = useLocation();

  useEffect(() => {
    const token = getToken();
    if (!token || isTokenExpired(token)) {
      void tryRefreshAccessToken();
    }
  }, []);

  return (
    <div className="container">
      <Navbar />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 2400,
          style: {
            border: "2px solid #2b2d33",
            background: "#f7f6f1",
            color: "#1e1f25",
            borderRadius: "12px",
            boxShadow: "4px 4px 0 #2f3238",
            fontWeight: "700",
          },
          success: {
            iconTheme: { primary: "#166534", secondary: "#dcfce7" },
          },
          error: {
            iconTheme: { primary: "#b91c1c", secondary: "#fee2e2" },
          },
        }}
      />
      <main key={location.pathname} className="pageTransition">
        <Routes location={location}>
          <Route path="/" element={<HomePage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/poll/:slug" element={<PublicPollPage />} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/poll/create" element={<ProtectedRoute><CreatePollPage /></ProtectedRoute>} />
          <Route path="/poll/:slug/analytics" element={<ProtectedRoute><PollAnalyticsPage /></ProtectedRoute>} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
