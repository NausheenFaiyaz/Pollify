const PKCE_VERIFIER_KEY = "ps_pkce_verifier";
const PKCE_STATE_KEY = "ps_pkce_state";

export const getToken = () => localStorage.getItem("ps_token");
export const setToken = (token: string) => localStorage.setItem("ps_token", token);
export const clearToken = () => localStorage.removeItem("ps_token");

const issuer = import.meta.env.VITE_OIDC_ISSUER as string;
const clientId = import.meta.env.VITE_OIDC_CLIENT_ID as string;
const redirectUri = import.meta.env.VITE_OIDC_REDIRECT_URI as string;

const base64Url = (buffer: ArrayBuffer) =>
  btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

const randomString = (length = 64) => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes).map((b) => chars[b % chars.length]).join("");
};

const createCodeChallenge = async (verifier: string) => {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return base64Url(digest);
};

export const startOidcLogin = async () => {
  const codeVerifier = randomString(64);
  const codeChallenge = await createCodeChallenge(codeVerifier);
  const state = crypto.randomUUID();

  localStorage.setItem(PKCE_VERIFIER_KEY, codeVerifier);
  localStorage.setItem(PKCE_STATE_KEY, state);

  const authUrl = new URL(`${issuer.replace(/\/$/, "")}/user/login`);
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("code_challenge", codeChallenge);
  authUrl.searchParams.set("code_challenge_method", "S256");

  window.location.href = authUrl.toString();
};

export const consumePkceData = () => {
  const verifier = localStorage.getItem(PKCE_VERIFIER_KEY);
  const state = localStorage.getItem(PKCE_STATE_KEY);
  localStorage.removeItem(PKCE_VERIFIER_KEY);
  localStorage.removeItem(PKCE_STATE_KEY);
  return { verifier, state };
};
