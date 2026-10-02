import "server-only";
import { type NextRequest } from "next/server";
import { type ZodSchema } from "zod";
import { AppError } from "../errors/app-error";

export async function validateBody<T>(req: NextRequest, schema: ZodSchema<T>): Promise<T> {
  try {
    const raw = await req.json();
    const result = schema.safeParse(raw);
    if (!result.success) {
      throw AppError.badRequest("Invalid request body", result.error.format());
    }
    return result.data;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw AppError.badRequest("Malformed JSON body");
  }
}

export function validateQuery<T>(req: NextRequest, schema: ZodSchema<T>): T {
  const url = new URL(req.url);
  const queryObj: Record<string, string> = {};
  url.searchParams.forEach((val, key) => {
    queryObj[key] = val;
  });

  const result = schema.safeParse(queryObj);
  if (!result.success) {
    throw AppError.badRequest("Invalid query parameters", result.error.format());
  }
  return result.data;
}
