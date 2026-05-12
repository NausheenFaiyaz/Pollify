import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import { consumePkceData, setToken } from "../auth/oidc";

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [message, setMessage] = useState("Signing you in...");

  useEffect(() => {
    const run = async () => {
      try {
        const query = new URLSearchParams(window.location.search);
        const code = query.get("code");
        const returnedState = query.get("state");
        const { verifier, state, returnTo } = consumePkceData();

        if (!code || !verifier || !state || returnedState !== state) {
          navigate("/");
          return;
        }

        const res = await api.post("/auth/oidc/exchange", {
          code,
          codeVerifier: verifier,
        });

        const accessToken = res.data?.data?.accessToken;
        if (!accessToken) {
          navigate("/");
          return;
        }

        setToken(accessToken);
        await api.get("/auth/me");

        navigate(returnTo || "/dashboard");
      } catch {
        setMessage("Login failed. Please try again.");
      }
    };

    void run();
  }, [navigate]);

  return <p>{message}</p>;
}
