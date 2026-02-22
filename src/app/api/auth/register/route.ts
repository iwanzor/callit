import { NextResponse } from "next/server";
import { db, users } from "@/lib/db";
import { hashPassword, signAccessToken, signRefreshToken } from "@/lib/auth";
import { registerSchema } from "@/lib/validations";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate input
    const result = registerSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { email, password, displayName } = result.data;

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const userId = crypto.randomUUID();
    await db.insert(users).values({
      id: userId,
      email: email.toLowerCase(),
      passwordHash,
      displayName: displayName || null,
      authProvider: "email",
    });

    // Generate tokens
    const accessToken = await signAccessToken({
      userId,
      email: email.toLowerCase(),
      isAdmin: false,
    });
    const refreshToken = await signRefreshToken(userId);

    return NextResponse.json(
      {
        user: {
          id: userId,
          email: email.toLowerCase(),
          displayName: displayName || null,
          isAdmin: false,
        },
        accessToken,
        refreshToken,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
