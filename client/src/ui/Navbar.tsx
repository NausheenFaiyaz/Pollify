import { Link, NavLink } from "react-router-dom";
import { clearToken, getToken, startOidcLogin } from "../auth/oidc";

export default function Navbar() {
  const token = getToken();

  return (
    <header className="topbar">
      <Link to="/" className="brand">PollShinobi</Link>
      <nav className="topnav">
        <NavLink to="/dashboard" className={({ isActive }) => (isActive ? "active" : "")}>Dashboard</NavLink>
        <NavLink to="/poll/create" className={({ isActive }) => (isActive ? "active" : "")}>Create Poll</NavLink>
      </nav>
      {token ? (
        <button className="btn btn-outline" onClick={() => { clearToken(); window.location.href = "/"; }}>Logout</button>
      ) : (
        <button className="btn" onClick={() => void startOidcLogin()}>Login</button>
      )}
    </header>
  );
}
