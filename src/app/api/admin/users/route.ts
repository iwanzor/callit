import { NextRequest, NextResponse } from "next/server";
import { db, users, orders } from "@/lib/db";
import { sql, desc, eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

// GET /api/admin/users - List all users
export async function GET(request: NextRequest) {
  try {
    // Auth check (optional for now)
    const user = await getCurrentUser(request);
    // In production, verify user.isAdmin

    // Get all users with trade counts
    const userList = await db
      .select({
        id: users.id,
        email: users.email,
        displayName: users.displayName,
        balance: users.balance,
        frozenBalance: users.frozenBalance,
        isAdmin: users.isAdmin,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt));

    // Get trade counts per user
    const tradeCounts = await db
      .select({
        userId: orders.userId,
        count: sql<number>`count(*)`,
      })
      .from(orders)
      .groupBy(orders.userId);

    const tradeCountMap = new Map(tradeCounts.map((tc) => [tc.userId, Number(tc.count)]));

    const transformedUsers = userList.map((u) => ({
      id: u.id,
      email: u.email,
      displayName: u.displayName,
      balance: parseFloat(u.balance),
      frozenBalance: parseFloat(u.frozenBalance),
      isAdmin: u.isAdmin,
      createdAt: u.createdAt.toISOString(),
      totalTrades: tradeCountMap.get(u.id) || 0,
    }));

    return NextResponse.json({ users: transformedUsers });
  } catch (error) {
    console.error("Admin users error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
