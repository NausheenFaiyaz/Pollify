import { Link, NavLink } from "react-router-dom";
import { clearToken, getToken, startOidcLogin } from "../auth/oidc";

export default function Navbar() {
  const token = getToken();

  return (
    <header className="topbar">
      <Link to="/" className="brand">PulseBoard</Link>
      <nav>
        <NavLink to="/dashboard">Dashboard</NavLink>
        <NavLink to="/poll/create">Create Poll</NavLink>
      </nav>
      {token ? (
        <button onClick={() => { clearToken(); window.location.href = "/"; }}>Logout</button>
      ) : (
        <button onClick={startOidcLogin}>Login</button>
      )}
    </header>
  );
}
