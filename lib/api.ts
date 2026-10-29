import { createHash, timingSafeEqual } from "node:crypto";
import { connectDb } from "@/lib/db";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public headers: Record<string, string> = {},
  ) {
    super(message);
  }
}

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,X-API-Key,Idempotency-Key",
  "Access-Control-Expose-Headers": "Retry-After",
};

export function json(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return Response.json(body, { status, headers: { ...CORS_HEADERS, ...headers } });
}

export function errorResponse(status: number, message: string, headers: Record<string, string> = {}) {
  return json({ error: message }, status, headers);
}

export async function readJson(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    throw new ApiError(400, "request body must be valid JSON");
  }
}

function digest(value: string): Buffer {
  return createHash("sha256").update(value).digest();
}

function assertApiKey(req: Request) {
  const expected = process.env.API_KEY;
  if (!expected) throw new ApiError(500, "server is missing API_KEY");
  const provided = req.headers.get("x-api-key") ?? "";
  // Hash first so both buffers have equal length for timingSafeEqual.
  if (!timingSafeEqual(digest(provided), digest(expected))) {
    throw new ApiError(401, "missing or invalid API key");
  }
}

export type RouteContext = { params: Promise<Record<string, string>> };
type Handler = (req: Request, ctx: RouteContext) => Promise<Response>;

/** Wraps a controller with API-key auth (optional), DB connection, CORS and the shared error shape. */
export function route(handler: Handler, options: { auth: boolean } = { auth: true }): Handler {
  return async (req, ctx) => {
    try {
      if (options.auth) assertApiKey(req);
      await connectDb();
      return await handler(req, ctx);
    } catch (err) {
      if (err instanceof ApiError) return errorResponse(err.status, err.message, err.headers);
      console.error(err);
      return errorResponse(500, "internal server error");
    }
  };
}

export function preflight(): Response {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}
