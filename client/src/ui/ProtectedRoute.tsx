import type { ReactElement } from "react";
import { startOidcLogin } from "../auth/oidc";
import { useAuthToken } from "../auth/useAuthToken";

export default function ProtectedRoute({ children }: { children: ReactElement }) {
  const token = useAuthToken();

  if (!token) {
    const returnTo = `${window.location.pathname}${window.location.search}`;
    return (
      <section className="pollSection authGateCard">
        <div>
          <h2 className="authGateTitle">SIGN IN REQUIRED</h2>
          <p className="muted">Creator tools are protected. Sign in to build polls and view analytics.</p>
        </div>
        <button className="btn authGateBtn" type="button" onClick={() => void startOidcLogin(returnTo)}>
          Continue with TokenShinobi
        </button>
      </section>
    );
  }

  return children;
}
