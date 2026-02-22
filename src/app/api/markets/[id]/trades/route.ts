import { NextRequest, NextResponse } from "next/server";
import { db, trades, markets } from "@/lib/db";
import { eq, desc } from "drizzle-orm";

type Params = Promise<{ id: string }>;

// GET /api/markets/[id]/trades - Get recent trades for a market
export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);

    // Verify market exists
    const [market] = await db
      .select({ id: markets.id })
      .from(markets)
      .where(eq(markets.id, id))
      .limit(1);

    if (!market) {
      return NextResponse.json(
        { error: "Market not found" },
        { status: 404 }
      );
    }

    // Get recent trades
    const recentTrades = await db
      .select({
        id: trades.id,
        side: trades.side,
        price: trades.price,
        quantity: trades.quantity,
        createdAt: trades.createdAt,
      })
      .from(trades)
      .where(eq(trades.marketId, id))
      .orderBy(desc(trades.createdAt))
      .limit(limit);

    return NextResponse.json({
      marketId: id,
      trades: recentTrades.map((t) => ({
        id: t.id,
        side: t.side,
        price: parseFloat(t.price),
        quantity: parseFloat(t.quantity),
        createdAt: t.createdAt,
      })),
    });
  } catch (error) {
    console.error("Get trades error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
