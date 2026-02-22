import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

// Routes that require authentication
const protectedApiRoutes = [
  "/api/user/",
  "/api/orders/",
  "/api/positions/",
];

// Routes that require admin
const adminApiRoutes = [
  "/api/admin/",
];

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not set");
  }
  return new TextEncoder().encode(secret);
}

function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.slice(7);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if route is protected
  const isProtectedApi = protectedApiRoutes.some((route) =>
    pathname.startsWith(route)
  );
  const isAdminApi = adminApiRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (!isProtectedApi && !isAdminApi) {
    return NextResponse.next();
  }

  // Get token from header
  const authHeader = request.headers.get("Authorization");
  const token = extractBearerToken(authHeader);

  if (!token) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  try {
    // Verify token
    const { payload } = await jwtVerify(token, getJwtSecret());

    // Check admin access
    if (isAdminApi && !payload.isAdmin) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    // Add user info to headers for downstream handlers
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-user-id", payload.sub as string);
    requestHeaders.set("x-user-email", payload.email as string);
    requestHeaders.set("x-user-is-admin", String(payload.isAdmin));

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Invalid or expired token" },
      { status: 401 }
    );
  }
}

export const config = {
  matcher: ["/api/:path*"],
};
