/**
 * DesignForge AI — Error Handling Middleware
 */

import type { Request, Response, NextFunction } from "express";

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code: string = "INTERNAL_ERROR",
    public details?: unknown
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(400, message, "VALIDATION_ERROR", details);
  }
}

export class ProcessingError extends AppError {
  constructor(message: string, details?: unknown) {
    super(422, message, "PROCESSING_ERROR", details);
  }
}

export class AIServiceError extends AppError {
  constructor(message: string, details?: unknown) {
    super(502, message, "AI_SERVICE_ERROR", details);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = "Too many requests. Please try again later.") {
    super(429, message, "RATE_LIMIT_ERROR");
  }
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error(`[ERROR] ${err.name}: ${err.message}`);

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
    return;
  }

  // Multer file size error
  if (err.message?.includes("File too large")) {
    res.status(413).json({
      success: false,
      error: {
        code: "FILE_TOO_LARGE",
        message: "The uploaded file exceeds the maximum allowed size.",
      },
    });
    return;
  }

  // Unknown errors
  res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_ERROR",
      message:
        process.env["NODE_ENV"] === "production"
          ? "An unexpected error occurred. Please try again."
          : err.message,
    },
  });
}
