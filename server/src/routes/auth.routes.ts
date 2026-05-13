import { Router } from "express";
import { type CookieOptions } from "express";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { User } from "../models/User.js";

const router = Router();
const REFRESH_COOKIE_NAME = "ps_refresh_token";

const refreshCookieOptions = (): CookieOptions => {
  const clientOrigins = process.env.CLIENT_URL?.split(",").map((x) => x.trim()).filter(Boolean) ?? [];
  const allLocalhost = clientOrigins.length > 0 && clientOrigins.every((origin) => /^(http:\/\/)?(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin));
  const secure = !allLocalhost;
  return {
    httpOnly: true,
    secure,
    sameSite: secure ? "none" : "lax",
    path: "/api/auth",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
};

router.post(
  "/oidc/exchange",
  asyncHandler(async (req, res) => {
    const { code, codeVerifier } = req.body as { code?: string; codeVerifier?: string };

    if (!code || !codeVerifier) {
      throw ApiError.badRequest("code and codeVerifier are required");
    }

    const tokenEndpoint = process.env.OIDC_TOKEN_ENDPOINT ?? "https://token-shinobi.onrender.com/token";
    const clientId = process.env.OIDC_CLIENT_ID;
    const clientSecret = process.env.OIDC_CLIENT_SECRET;
    const redirectUri = process.env.OIDC_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      throw ApiError.internal("OIDC server env vars are not configured");
    }

    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    });

    const tokenResponse = await fetch(tokenEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    if (!tokenResponse.ok) {
      const text = await tokenResponse.text();
      throw ApiError.unauthorized(`OIDC token exchange failed: ${text}`);
    }

    const tokenPayload = (await tokenResponse.json()) as Record<string, unknown>;
    const refreshToken = typeof tokenPayload.refreshToken === "string" ? tokenPayload.refreshToken : null;
    const accessToken = typeof tokenPayload.accessToken === "string" ? tokenPayload.accessToken : null;

    if (!accessToken || !refreshToken) {
      throw ApiError.unauthorized("OIDC response did not return required tokens");
    }

    res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions());
    return ApiResponse.ok(res, "OIDC exchange successful", {
      accessToken,
      tokenType: tokenPayload.token_type,
      expiresIn: tokenPayload.expires_in,
    });
  })
);

router.post(
  "/refresh",
  asyncHandler(async (req, res) => {
    const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;
    if (!refreshToken) {
      throw ApiError.unauthorized("Missing refresh token");
    }

    const tokenEndpoint = process.env.OIDC_TOKEN_ENDPOINT ?? "https://token-shinobi.onrender.com/token";
    const clientId = process.env.OIDC_CLIENT_ID;
    const clientSecret = process.env.OIDC_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw ApiError.internal("OIDC server env vars are not configured");
    }

    const body = new URLSearchParams({
      grant_type: "refresh_token",
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
    });

    const tokenResponse = await fetch(tokenEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    if (!tokenResponse.ok) {
      res.clearCookie(REFRESH_COOKIE_NAME, refreshCookieOptions());
      throw ApiError.unauthorized("Refresh token exchange failed");
    }

    const tokenPayload = (await tokenResponse.json()) as Record<string, unknown>;
    const nextRefreshToken = typeof tokenPayload.refreshToken === "string" ? tokenPayload.refreshToken : null;
    const nextAccessToken = typeof tokenPayload.accessToken === "string" ? tokenPayload.accessToken : null;

    if (!nextAccessToken || !nextRefreshToken) {
      res.clearCookie(REFRESH_COOKIE_NAME, refreshCookieOptions());
      throw ApiError.unauthorized("Refresh response missing tokens");
    }

    res.cookie(REFRESH_COOKIE_NAME, nextRefreshToken, refreshCookieOptions());
    return ApiResponse.ok(res, "Token refreshed", {
      accessToken: nextAccessToken,
      tokenType: tokenPayload.token_type,
      expiresIn: tokenPayload.expires_in,
    });
  })
);

router.post(
  "/logout",
  asyncHandler(async (_req, res) => {
    res.clearCookie(REFRESH_COOKIE_NAME, refreshCookieOptions());
    return ApiResponse.ok(res, "Logged out", null);
  })
);

router.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const payload = req.auth!;
    await User.findOneAndUpdate(
      { sub: payload.sub },
      {
        sub: payload.sub,
        email: typeof payload.email === "string" ? payload.email : "",
        name: typeof payload.name === "string" ? payload.name : "",
        picture: typeof payload.picture === "string" ? payload.picture : "",
      },
      { upsert: true, returnDocument: "after" }
    );

    return ApiResponse.ok(res, "Current user", {
      sub: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
    });
  })
);

export default router;

