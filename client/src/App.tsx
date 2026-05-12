import { Route, Routes } from "react-router-dom";
import "./App.css";
import Navbar from "./ui/Navbar";
import ProtectedRoute from "./ui/ProtectedRoute";
import AuthCallbackPage from "./pages/AuthCallbackPage";
import CreatePollPage from "./pages/CreatePollPage";
import DashboardPage from "./pages/DashboardPage";
import HomePage from "./pages/HomePage";
import PollAnalyticsPage from "./pages/PollAnalyticsPage";
import PublicPollPage from "./pages/PublicPollPage";

function App() {
  return (
    <div className="container">
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="/poll/:slug" element={<PublicPollPage />} />
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/poll/create" element={<ProtectedRoute><CreatePollPage /></ProtectedRoute>} />
        <Route path="/poll/:slug/analytics" element={<ProtectedRoute><PollAnalyticsPage /></ProtectedRoute>} />
      </Routes>
    </div>
  );
}

export default App;

