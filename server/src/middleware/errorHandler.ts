import { type NextFunction, type Request, type Response } from "express";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

export const notFoundHandler = (_req: Request, _res: Response, next: NextFunction) => {
  next(ApiError.notFound("Route not found"));
};

export const errorHandler = (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof ApiError) {
    return ApiResponse.send(res, err.statusCode, err.message, null, { errors: err.errors });
  }

  const fallback = err instanceof Error ? err.message : "Something went wrong";
  return ApiResponse.send(res, 500, fallback);
};
