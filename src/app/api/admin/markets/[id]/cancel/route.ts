import { NextRequest, NextResponse } from "next/server";
import { db, markets, positions, users, transactions, orders } from "@/lib/db";
import { eq, and, or, gt } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { getCurrentUser } from "@/lib/auth";

type Params = Promise<{ id: string }>;

// POST /api/admin/markets/[id]/cancel - Cancel/void a market and refund positions
export async function POST(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { reason } = body;

    // Auth check (optional for now)
    const user = await getCurrentUser(request);
    // In production, verify user.isAdmin

    // Get the market
    const [market] = await db
      .select()
      .from(markets)
      .where(eq(markets.id, id))
      .limit(1);

    if (!market) {
      return NextResponse.json(
        { error: "Market not found" },
        { status: 404 }
      );
    }

    if (market.status === "resolved" || market.status === "cancelled") {
      return NextResponse.json(
        { error: "Market is already resolved or cancelled" },
        { status: 400 }
      );
    }

    // Cancel all open orders first
    await db
      .update(orders)
      .set({ status: "cancelled" })
      .where(
        and(
          eq(orders.marketId, id),
          eq(orders.status, "open")
        )
      );

    // Get all positions with shares
    const allPositions = await db
      .select()
      .from(positions)
      .where(eq(positions.marketId, id));

    // Refund all positions based on their average purchase price
    let totalRefunded = 0;
    for (const position of allPositions) {
      const yesShares = parseFloat(position.yesShares);
      const noShares = parseFloat(position.noShares);
      const avgYesPrice = position.avgYesPrice ? parseFloat(position.avgYesPrice) : 0.5;
      const avgNoPrice = position.avgNoPrice ? parseFloat(position.avgNoPrice) : 0.5;

      // Calculate refund: shares * avg price paid
      const yesRefund = yesShares * avgYesPrice;
      const noRefund = noShares * avgNoPrice;
      const totalRefund = yesRefund + noRefund;

      if (totalRefund > 0) {
        totalRefunded += totalRefund;

        // Get current user balance
        const [userRecord] = await db
          .select({ balance: users.balance })
          .from(users)
          .where(eq(users.id, position.userId))
          .limit(1);

        if (userRecord) {
          const newBalance = parseFloat(userRecord.balance) + totalRefund;

          // Update user balance
          await db
            .update(users)
            .set({ balance: newBalance.toFixed(2) })
            .where(eq(users.id, position.userId));

          // Create refund transaction
          await db.insert(transactions).values({
            id: uuidv4(),
            userId: position.userId,
            type: "refund",
            amount: totalRefund.toFixed(2),
            balanceAfter: newBalance.toFixed(2),
            referenceType: "market",
            referenceId: id,
            status: "completed",
            metadata: JSON.stringify({
              marketId: id,
              reason: "market_cancelled",
              yesShares,
              noShares,
              yesRefund,
              noRefund,
            }),
          });
        }
      }
    }

    // Update market status
    await db
      .update(markets)
      .set({
        status: "cancelled",
        resolutionSource: reason || "Market cancelled by admin",
        resolvedBy: "admin",
        resolvedAtActual: new Date(),
      })
      .where(eq(markets.id, id));

    // Get updated market
    const [cancelledMarket] = await db
      .select()
      .from(markets)
      .where(eq(markets.id, id))
      .limit(1);

    return NextResponse.json({
      market: {
        ...cancelledMarket,
        yesPrice: parseFloat(cancelledMarket.yesPrice),
        noPrice: 1 - parseFloat(cancelledMarket.yesPrice),
        totalVolume: parseFloat(cancelledMarket.totalVolume),
      },
      refund: {
        positionsRefunded: allPositions.filter(
          (p) => parseFloat(p.yesShares) > 0 || parseFloat(p.noShares) > 0
        ).length,
        totalRefunded,
      },
    });
  } catch (error) {
    console.error("Cancel market error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
