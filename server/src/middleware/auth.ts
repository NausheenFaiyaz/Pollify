import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";
import { type NextFunction, type Request, type Response } from "express";
import ApiError from "../utils/ApiError.js";

const issuer = process.env.OIDC_ISSUER_URL ?? "https://token-shinobi.onrender.com";
const audience = process.env.OIDC_AUDIENCE;
const jwksUri = process.env.OIDC_JWKS_URI ?? `${issuer.replace(/\/$/, "")}/certs`;
const jwks = createRemoteJWKSet(new URL(jwksUri));

const parseToken = (req: Request) => {
  const header = req.headers.authorization;
  if (!header) return null;
  const [type, token] = header.split(" ");
  if (type !== "Bearer" || !token) return null;
  return token;
};

const verifyToken = async (token: string): Promise<(JWTPayload & { sub: string }) | null> => {
  const options: { issuer?: string; audience?: string } = {};
  if (audience) options.audience = audience;

  const verified = await jwtVerify(token, jwks, options);
  const rawSub = verified.payload.sub ?? (verified.payload.id !== undefined ? String(verified.payload.id) : undefined);

  if (!rawSub) return null;

  return {
    ...verified.payload,
    sub: rawSub,
    iss: verified.payload.iss ?? issuer,
  } as JWTPayload & { sub: string };
};

export const optionalAuth = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const token = parseToken(req);
    if (!token) return next();
    const payload = await verifyToken(token);
    if (payload) {
      req.auth = payload;
      req.authToken = token;
    }
    return next();
  } catch {
    return next();
  }
};

export const requireAuth = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const token = parseToken(req);
    if (!token) return next(ApiError.unauthorized("Missing Bearer token"));

    const payload = await verifyToken(token);
    if (!payload) return next(ApiError.unauthorized("Invalid token payload"));

    req.auth = payload;
    req.authToken = token;
    return next();
  } catch {
    return next(ApiError.unauthorized("Token verification failed"));
  }
};
