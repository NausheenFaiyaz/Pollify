import { type JwtPayload } from "jose";

declare global {
  namespace Express {
    interface Request {
      auth?: JwtPayload & { sub: string };
      authToken?: string;
    }
  }
}

export {};
