import { useEffect, useRef, useState, type ReactElement } from "react";
import { startOidcLogin } from "../auth/oidc";
import { useAuthToken } from "../auth/useAuthToken";
import { tryRefreshAccessToken } from "../api/client";

export default function ProtectedRoute({ children }: { children: ReactElement }) {
  const token = useAuthToken();
  const [isCheckingSession, setIsCheckingSession] = useState(!token);
  const attemptedRefresh = useRef(false);

  useEffect(() => {
    if (token) {
      setIsCheckingSession(false);
      return;
    }

    if (attemptedRefresh.current) {
      setIsCheckingSession(false);
      return;
    }

    attemptedRefresh.current = true;
    setIsCheckingSession(true);
    void tryRefreshAccessToken().finally(() => {
      setIsCheckingSession(false);
    });
  }, [token]);

  if (isCheckingSession) {
    return null;
  }

  if (!token) {
    const returnTo = `${window.location.pathname}${window.location.search}`;
    return (
      <section className="pollSection authGateCard">
        <div>
          <h2 className="authGateTitle">READY TO RUN THE VOTE?</h2>
          <p className="muted">Sign in to launch polls, track live responses, and unlock your creator dashboard.</p>
        </div>
        <button className="btn authGateBtn" type="button" onClick={() => void startOidcLogin(returnTo)}>
          Continue with TokenShinobi
        </button>
      </section>
    );
  }

  return children;
}
