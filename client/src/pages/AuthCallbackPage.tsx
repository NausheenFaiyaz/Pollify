import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import { consumePkceData, setToken } from "../auth/oidc";

export default function AuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const run = async () => {
      const query = new URLSearchParams(window.location.search);
      const code = query.get("code");
      const returnedState = query.get("state");
      const { verifier, state } = consumePkceData();

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
      navigate("/dashboard");
    };

    void run();
  }, [navigate]);

  return <p>Signing you in...</p>;
}
