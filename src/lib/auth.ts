import { SignJWT, jwtVerify, JWTPayload } from "jose";
import bcrypt from "bcrypt";

const BCRYPT_COST = 12;
const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY = "7d";

// Get secrets from environment
function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not set");
  }
  return new TextEncoder().encode(secret);
}

function getRefreshSecret(): Uint8Array {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) {
    throw new Error("JWT_REFRESH_SECRET is not set");
  }
  return new TextEncoder().encode(secret);
}

// Token payload types
export interface AccessTokenPayload extends JWTPayload {
  sub: string; // User ID
  email: string;
  isAdmin: boolean;
}

export interface RefreshTokenPayload extends JWTPayload {
  sub: string; // User ID
  type: "refresh";
}

// Password hashing
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_COST);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Access token functions
export async function signAccessToken(payload: {
  userId: string;
  email: string;
  isAdmin: boolean;
}): Promise<string> {
  const token = await new SignJWT({
    sub: payload.userId,
    email: payload.email,
    isAdmin: payload.isAdmin,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .sign(getJwtSecret());

  return token;
}

export async function verifyAccessToken(
  token: string
): Promise<AccessTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    return payload as AccessTokenPayload;
  } catch {
    return null;
  }
}

// Refresh token functions
export async function signRefreshToken(userId: string): Promise<string> {
  const token = await new SignJWT({
    sub: userId,
    type: "refresh",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_EXPIRY)
    .sign(getRefreshSecret());

  return token;
}

export async function verifyRefreshToken(
  token: string
): Promise<RefreshTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getRefreshSecret());
    if (payload.type !== "refresh") {
      return null;
    }
    return payload as RefreshTokenPayload;
  } catch {
    return null;
  }
}

// Extract token from Authorization header
export function extractBearerToken(
  authHeader: string | null
): string | null {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.slice(7);
}

// Get current user from request
export async function getCurrentUser(
  request: Request
): Promise<AccessTokenPayload | null> {
  const authHeader = request.headers.get("Authorization");
  const token = extractBearerToken(authHeader);
  if (!token) {
    return null;
  }
  return verifyAccessToken(token);
}
