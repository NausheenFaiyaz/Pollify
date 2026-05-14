const PKCE_VERIFIER_KEY = "ps_pkce_verifier";
const PKCE_STATE_KEY = "ps_pkce_state";
const POST_LOGIN_PATH_KEY = "ps_post_login_path";
const TOKEN_KEY = "ps_token";
const AUTH_CHANGED_EVENT = "ps:auth-changed";

const parseJwtExp = (token: string) => {
  try {
    const [, payloadBase64] = token.split(".");
    if (!payloadBase64) return null;
    const normalized = payloadBase64.replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "="));
    const payload = JSON.parse(json) as { exp?: number };
    return typeof payload.exp === "number" ? payload.exp : null;
  } catch {
    return null;
  }
};

const emitAuthChanged = () => {
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
};

export const getToken = () => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return null;
  return token;
};

export const isTokenExpired = (token: string) => {
  const exp = parseJwtExp(token);
  if (!exp) return false;
  return Date.now() >= exp * 1000;
};

export const setToken = (token: string) => {
  localStorage.setItem(TOKEN_KEY, token);
  emitAuthChanged();
};

export const clearToken = () => {
  localStorage.removeItem(TOKEN_KEY);
  emitAuthChanged();
};

export const subscribeAuthChange = (listener: () => void) => {
  const onStorage = (event: StorageEvent) => {
    if (event.key === TOKEN_KEY) listener();
  };
  window.addEventListener(AUTH_CHANGED_EVENT, listener);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(AUTH_CHANGED_EVENT, listener);
    window.removeEventListener("storage", onStorage);
  };
};

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

export const startOidcLogin = async (returnTo?: string) => {
  const codeVerifier = randomString(64);
  const codeChallenge = await createCodeChallenge(codeVerifier);
  const state = crypto.randomUUID();
  const resolvedReturnTo =
    returnTo ??
    `${window.location.pathname}${window.location.search}${window.location.hash}`;

  localStorage.setItem(PKCE_VERIFIER_KEY, codeVerifier);
  localStorage.setItem(PKCE_STATE_KEY, state);
  localStorage.setItem(POST_LOGIN_PATH_KEY, resolvedReturnTo);

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
  const returnTo = localStorage.getItem(POST_LOGIN_PATH_KEY) ?? "/dashboard";
  localStorage.removeItem(PKCE_VERIFIER_KEY);
  localStorage.removeItem(PKCE_STATE_KEY);
  localStorage.removeItem(POST_LOGIN_PATH_KEY);
  return { verifier, state, returnTo };
};
