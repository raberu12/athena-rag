/**
 * API Utilities - Common patterns for API route handlers
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";

/**
 * API Error with status code
 */
export class ApiError extends Error {
    constructor(
        message: string,
        public statusCode: number = 500
    ) {
        super(message);
        this.name = "ApiError";
    }
}

/**
 * Unauthorized error (401)
 */
export class UnauthorizedError extends ApiError {
    constructor(message: string = "Unauthorized") {
        super(message, 401);
        this.name = "UnauthorizedError";
    }
}

/**
 * Not found error (404)
 */
export class NotFoundError extends ApiError {
    constructor(message: string = "Not found") {
        super(message, 404);
        this.name = "NotFoundError";
    }
}

/**
 * Bad request error (400)
 */
export class BadRequestError extends ApiError {
    constructor(message: string = "Bad request") {
        super(message, 400);
        this.name = "BadRequestError";
    }
}

/**
 * Require authenticated user for API route
 * Returns the authenticated user or throws UnauthorizedError
 */
export async function requireAuth(): Promise<{ user: User }> {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        throw new UnauthorizedError();
    }

    return { user };
}

/**
 * Standard API error response format
 */
export interface ApiErrorResponse {
    error: string;
}

/**
 * Handle API errors and return appropriate response
 */
export function handleApiError(
    error: unknown,
    context: string = "API"
): NextResponse<ApiErrorResponse> {
    // Log the error
    console.error(`[${context}] Error:`, error);

    // Handle known API errors
    if (error instanceof ApiError) {
        return NextResponse.json(
            { error: error.message },
            { status: error.statusCode }
        );
    }

    // Handle unknown errors
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
        { error: `Failed to process request: ${message}` },
        { status: 500 }
    );
}

/**
 * Validate that required fields exist and are non-empty strings
 */
export function validateRequiredFields<T extends Record<string, unknown>>(
    data: T,
    requiredFields: (keyof T)[]
): void {
    for (const field of requiredFields) {
        const value = data[field];
        if (value === undefined || value === null) {
            throw new BadRequestError(`Missing required field: ${String(field)}`);
        }
        if (typeof value === "string" && value.trim().length === 0) {
            throw new BadRequestError(`Field cannot be empty: ${String(field)}`);
        }
    }
}
