import { NextResponse } from "next/server";
import { db, users } from "@/lib/db";
import { eq } from "drizzle-orm";

// Helper to get user ID from middleware headers
function getUserId(request: Request): string | null {
  return request.headers.get("x-user-id");
}

export async function GET(request: Request) {
  try {
    const userId = getUserId(request);
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userResults = await db
      .select({
        balance: users.balance,
        frozenBalance: users.frozenBalance,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (userResults.length === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const { balance, frozenBalance } = userResults[0];
    const availableBalance =
      parseFloat(balance) - parseFloat(frozenBalance);

    return NextResponse.json({
      balance: parseFloat(balance),
      frozenBalance: parseFloat(frozenBalance),
      availableBalance,
    });
  } catch (error) {
    console.error("Get balance error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
