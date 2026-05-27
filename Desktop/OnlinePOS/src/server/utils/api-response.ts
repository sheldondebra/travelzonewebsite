import "@/lib/bigint-json";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AppError, InsufficientStockError } from "@/server/utils/errors";

export function apiSuccess<T>(
  data: T,
  message = "Success",
  status = 200,
) {
  return NextResponse.json({ success: true, data, message }, { status });
}

export function apiError(message: string, status = 400) {
  return NextResponse.json({ success: false, message }, { status });
}

export function handleApiError(error: unknown) {
  if (error instanceof ZodError) {
    return apiError(
      error.issues.map((i) => i.message).join(", ") || "Validation failed",
      400,
    );
  }

  if (error instanceof InsufficientStockError) {
    return NextResponse.json(
      {
        success: false,
        message: error.message,
        code: error.code,
        details: {
          productName: error.productName,
          available: error.available,
          requested: error.requested,
        },
      },
      { status: error.statusCode },
    );
  }

  if (error instanceof AppError) {
    return apiError(error.message, error.statusCode);
  }

  if (error instanceof Error) {
    return apiError(error.message, 400);
  }

  console.error("[API]", error);
  return apiError("Internal server error", 500);
}
