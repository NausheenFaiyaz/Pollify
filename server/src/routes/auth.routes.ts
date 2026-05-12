import { Router } from "express";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { User } from "../models/User.js";

const router = Router();

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
    return ApiResponse.ok(res, "OIDC exchange successful", tokenPayload);
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

