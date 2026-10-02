import { describe, it, expect } from "vitest";
import { AppError } from "@/server/platform/errors/app-error";
import { ERROR_CODES } from "@/server/platform/errors/error-codes";

describe("AppError Domain Exception Hierarchy", () => {
  it("should create badRequest error with status 400", () => {
    const err = AppError.badRequest("Invalid input parameters", { field: "email" });
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    expect(err.message).toBe("Invalid input parameters");
    expect(err.details).toEqual({ field: "email" });
    expect(err.isOperational).toBe(true);
  });

  it("should create unauthorized error with status 401", () => {
    const err = AppError.unauthorized();
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe(ERROR_CODES.UNAUTHORIZED);
  });

  it("should create forbidden error with status 403", () => {
    const err = AppError.forbidden("Access denied");
    expect(err.statusCode).toBe(403);
    expect(err.code).toBe(ERROR_CODES.FORBIDDEN);
  });

  it("should create notFound error with status 404", () => {
    const err = AppError.notFound("Lead not found");
    expect(err.statusCode).toBe(404);
    expect(err.code).toBe(ERROR_CODES.NOT_FOUND);
  });

  it("should create conflict error with status 409", () => {
    const err = AppError.conflict("Campaign already running");
    expect(err.statusCode).toBe(409);
    expect(err.code).toBe(ERROR_CODES.CONFLICT);
  });

  it("should create rateLimited error with status 429", () => {
    const err = AppError.rateLimited("Daily quota exhausted");
    expect(err.statusCode).toBe(429);
    expect(err.code).toBe(ERROR_CODES.RATE_LIMITED);
  });

  it("should create internal error with isOperational=false and status 500", () => {
    const err = AppError.internal("Database crashed");
    expect(err.statusCode).toBe(500);
    expect(err.isOperational).toBe(false);
  });
});
