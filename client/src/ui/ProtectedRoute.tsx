import type { ReactElement } from "react";
import { Navigate } from "react-router-dom";
import { getToken } from "../auth/oidc";

export default function ProtectedRoute({ children }: { children: ReactElement }) {
  if (!getToken()) return <Navigate to="/" replace />;
  return children;
}
