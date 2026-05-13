import { Link, NavLink } from "react-router-dom";
import { clearToken, startOidcLogin } from "../auth/oidc";
import { useAuthToken } from "../auth/useAuthToken";
import api from "../api/client";

export default function Navbar() {
  const token = useAuthToken();
  const onLogout = async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      clearToken();
      window.location.href = "/";
    }
  };

  return (
    <header className="topbar">
      <Link to="/" className="brand">PollShinobi</Link>
      <nav className="topnav">
        <NavLink to="/dashboard" className={({ isActive }) => (isActive ? "active" : "")}>Dashboard</NavLink>
        <NavLink to="/poll/create" className={({ isActive }) => (isActive ? "active" : "")}>Create Poll</NavLink>
      </nav>
      {token ? (
        <button className="btn btn-outline" onClick={() => void onLogout()}>Logout</button>
      ) : (
        <button className="btn" onClick={() => void startOidcLogin()}>Login</button>
      )}
    </header>
  );
}
