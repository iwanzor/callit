import { NextRequest, NextResponse } from "next/server";
import { db, users, markets, trades, transactions } from "@/lib/db";
import { eq, sql, desc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

// GET /api/admin/stats - Get admin dashboard stats
export async function GET(request: NextRequest) {
  try {
    // Auth check (optional for now)
    const user = await getCurrentUser(request);
    // In production, verify user.isAdmin

    // Get total users count
    const userCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(users);
    const totalUsers = Number(userCount[0]?.count || 0);

    // Get total volume
    const volumeResult = await db
      .select({ total: sql<number>`COALESCE(SUM(total_volume), 0)` })
      .from(markets);
    const totalVolume = Number(volumeResult[0]?.total || 0);

    // Get active markets (open status)
    const activeCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(markets)
      .where(eq(markets.status, "open"));
    const activeMarkets = Number(activeCount[0]?.count || 0);

    // Get pending resolutions (closed but not resolved)
    const pendingCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(markets)
      .where(eq(markets.status, "closed"));
    const pendingResolutions = Number(pendingCount[0]?.count || 0);

    // Get recent activity
    const recentUsers = await db
      .select({
        id: users.id,
        email: users.email,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(5);

    const recentMarkets = await db
      .select({
        id: markets.id,
        title: markets.title,
        createdAt: markets.createdAt,
      })
      .from(markets)
      .orderBy(desc(markets.createdAt))
      .limit(5);

    const recentTrades = await db
      .select({
        id: trades.id,
        side: trades.side,
        quantity: trades.quantity,
        price: trades.price,
        createdAt: trades.createdAt,
      })
      .from(trades)
      .orderBy(desc(trades.createdAt))
      .limit(5);

    // Combine and sort recent activity
    const recentActivity = [
      ...recentUsers.map((u) => ({
        id: u.id,
        type: "user_joined" as const,
        description: `New user: ${u.email}`,
        timestamp: u.createdAt.toISOString(),
      })),
      ...recentMarkets.map((m) => ({
        id: m.id,
        type: "market_created" as const,
        description: `Market created: ${m.title.slice(0, 50)}...`,
        timestamp: m.createdAt.toISOString(),
      })),
      ...recentTrades.map((t) => ({
        id: t.id,
        type: "trade" as const,
        description: `Trade: ${parseFloat(t.quantity)} ${t.side.toUpperCase()} shares @ ${(parseFloat(t.price) * 100).toFixed(0)}¢`,
        timestamp: t.createdAt.toISOString(),
      })),
    ]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);

    return NextResponse.json({
      totalUsers,
      totalVolume,
      activeMarkets,
      pendingResolutions,
      recentActivity,
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
