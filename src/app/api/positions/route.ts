import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db, positions, markets } from "@/lib/db";
import { eq, and } from "drizzle-orm";

// GET /api/positions - Get user's positions across all markets
export async function GET(request: Request) {
  try {
    // Authenticate user
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get query params
    const { searchParams } = new URL(request.url);
    const marketId = searchParams.get("marketId");

    // Build conditions
    const conditions = [eq(positions.userId, user.sub)];
    if (marketId) {
      conditions.push(eq(positions.marketId, marketId));
    }

    // Fetch positions
    const userPositions = await db
      .select({
        position: positions,
        market: {
          id: markets.id,
          title: markets.title,
          slug: markets.slug,
          status: markets.status,
          yesPrice: markets.yesPrice,
          resolution: markets.resolution,
        },
      })
      .from(positions)
      .innerJoin(markets, eq(positions.marketId, markets.id))
      .where(and(...conditions));

    // Calculate current values and unrealized P&L
    const enrichedPositions = userPositions.map((row) => {
      const yesShares = parseFloat(row.position.yesShares);
      const noShares = parseFloat(row.position.noShares);
      const currentYesPrice = parseFloat(row.market.yesPrice);
      const currentNoPrice = 1 - currentYesPrice;

      // Current value of positions
      const yesValue = yesShares * currentYesPrice;
      const noValue = noShares * currentNoPrice;
      const totalValue = yesValue + noValue;

      // Cost basis
      const avgYesPrice = row.position.avgYesPrice ? parseFloat(row.position.avgYesPrice) : 0;
      const avgNoPrice = row.position.avgNoPrice ? parseFloat(row.position.avgNoPrice) : 0;
      const yesCost = yesShares * avgYesPrice;
      const noCost = noShares * avgNoPrice;
      const totalCost = yesCost + noCost;

      // Unrealized P&L
      const unrealizedPnl = totalValue - totalCost;

      // Potential payout (if resolved)
      const yesPayout = yesShares * 1.0; // If YES wins, each YES share pays $1
      const noPayout = noShares * 1.0; // If NO wins, each NO share pays $1

      return {
        id: row.position.id,
        marketId: row.position.marketId,
        market: {
          title: row.market.title,
          slug: row.market.slug,
          status: row.market.status,
          resolution: row.market.resolution,
        },
        yesShares,
        noShares,
        avgYesPrice,
        avgNoPrice,
        currentYesPrice,
        currentNoPrice,
        yesValue,
        noValue,
        totalValue,
        totalCost,
        unrealizedPnl,
        realizedPnl: parseFloat(row.position.realizedPnl),
        potentialPayout: {
          ifYes: yesPayout,
          ifNo: noPayout,
        },
        createdAt: row.position.createdAt,
        updatedAt: row.position.updatedAt,
      };
    });

    // Filter out empty positions
    const activePositions = enrichedPositions.filter(
      (p) => p.yesShares > 0 || p.noShares > 0
    );

    // Calculate portfolio summary
    const summary = {
      totalValue: activePositions.reduce((sum, p) => sum + p.totalValue, 0),
      totalCost: activePositions.reduce((sum, p) => sum + p.totalCost, 0),
      totalUnrealizedPnl: activePositions.reduce((sum, p) => sum + p.unrealizedPnl, 0),
      totalRealizedPnl: activePositions.reduce((sum, p) => sum + p.realizedPnl, 0),
      positionCount: activePositions.length,
    };

    return NextResponse.json({
      positions: activePositions,
      summary,
    });
  } catch (error) {
    console.error("Error fetching positions:", error);
    return NextResponse.json({ error: "Failed to fetch positions" }, { status: 500 });
  }
}
