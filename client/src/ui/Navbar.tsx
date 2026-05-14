import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { clearToken, startOidcLogin } from "../auth/oidc";
import { useAuthToken } from "../auth/useAuthToken";
import api from "../api/client";
import { FaBars, FaTimes } from "react-icons/fa";

export default function Navbar() {
  const token = useAuthToken();
  const [menuOpen, setMenuOpen] = useState(false);
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
      <Link to="/" className="brand">
        Pollify
      </Link>
      <button
        type="button"
        className="menuToggle"
        aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((prev) => !prev)}
      >
        {menuOpen ? <FaTimes /> : <FaBars />}
      </button>
      <nav className={`topnav ${menuOpen ? "open" : ""}`}>
        <NavLink
          to="/dashboard"
          className={({ isActive }) => (isActive ? "active" : "")}
          onClick={() => setMenuOpen(false)}
        >
          Dashboard
        </NavLink>
        <NavLink
          to="/poll/create"
          className={({ isActive }) => (isActive ? "active" : "")}
          onClick={() => setMenuOpen(false)}
        >
          Create Poll
        </NavLink>
        {token ? (
          <button
            className="btn btn-outline navAuthBtn mobileMenuAuthBtn"
            onClick={() => void onLogout()}
          >
            Logout
          </button>
        ) : (
          <button
            className="btn navAuthBtn mobileMenuAuthBtn"
            onClick={() => void startOidcLogin()}
          >
            Login
          </button>
        )}
      </nav>
    </header>
  );
}
