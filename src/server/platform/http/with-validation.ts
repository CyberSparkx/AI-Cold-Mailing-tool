import "server-only";
import { type NextRequest } from "next/server";
import { type z } from "zod";
import { AppError } from "../errors/app-error";

export async function validateBody<T extends z.ZodTypeAny>(
  req: NextRequest,
  schema: T
): Promise<z.output<T>> {
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

export function validateQuery<T extends z.ZodTypeAny>(
  req: NextRequest,
  schema: T
): z.output<T> {
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
