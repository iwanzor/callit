import { NextResponse } from "next/server";
import { db, users } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    // Verify token and get user from it
    const tokenUser = await getCurrentUser(request);
    if (!tokenUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch fresh user data from database
    const userResults = await db
      .select({
        id: users.id,
        email: users.email,
        displayName: users.displayName,
        isAdmin: users.isAdmin,
        kycStatus: users.kycStatus,
        balance: users.balance,
        frozenBalance: users.frozenBalance,
        authProvider: users.authProvider,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, tokenUser.sub))
      .limit(1);

    if (userResults.length === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ user: userResults[0] });
  } catch (error) {
    console.error("Get user error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
