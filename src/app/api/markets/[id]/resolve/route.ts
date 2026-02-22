import { NextRequest, NextResponse } from "next/server";
import { db, markets, positions, users, transactions } from "@/lib/db";
import { eq, and, gt } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

type Params = Promise<{ id: string }>;

// POST /api/markets/[id]/resolve - Resolve a market (admin only, auth skipped for now)
export async function POST(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { resolution, resolutionSource } = body;

    // Validation
    if (!resolution || !["yes", "no"].includes(resolution)) {
      return NextResponse.json(
        { error: "Resolution must be 'yes' or 'no'" },
        { status: 400 }
      );
    }

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

    if (market.status === "resolved") {
      return NextResponse.json(
        { error: "Market is already resolved" },
        { status: 400 }
      );
    }

    if (market.status !== "open" && market.status !== "closed") {
      return NextResponse.json(
        { error: "Market cannot be resolved in its current status" },
        { status: 400 }
      );
    }

    // Update market status
    await db
      .update(markets)
      .set({
        status: "resolved",
        resolution: resolution,
        resolvedBy: "admin", // Skipping auth for now
        resolvedAtActual: new Date(),
        resolutionSource: resolutionSource || null,
      })
      .where(eq(markets.id, id));

    // Pay out winning positions
    const winningShareColumn = resolution === "yes" ? "yesShares" : "noShares";
    
    // Get all positions with winning shares
    const winningPositions = await db
      .select()
      .from(positions)
      .where(
        and(
          eq(positions.marketId, id),
          resolution === "yes" 
            ? gt(positions.yesShares, "0")
            : gt(positions.noShares, "0")
        )
      );

    // Process payouts
    let totalPaidOut = 0;
    for (const position of winningPositions) {
      const winningShares = parseFloat(
        resolution === "yes" ? position.yesShares : position.noShares
      );
      
      if (winningShares > 0) {
        // Each winning share pays out $1
        const payout = winningShares;
        totalPaidOut += payout;

        // Get current user balance
        const [user] = await db
          .select({ balance: users.balance })
          .from(users)
          .where(eq(users.id, position.userId))
          .limit(1);

        if (user) {
          const newBalance = parseFloat(user.balance) + payout;

          // Update user balance
          await db
            .update(users)
            .set({ balance: newBalance.toFixed(2) })
            .where(eq(users.id, position.userId));

          // Create transaction record
          await db.insert(transactions).values({
            id: uuidv4(),
            userId: position.userId,
            type: "payout",
            amount: payout.toFixed(2),
            balanceAfter: newBalance.toFixed(2),
            referenceType: "market",
            referenceId: id,
            status: "completed",
            metadata: JSON.stringify({
              marketId: id,
              resolution,
              shares: winningShares,
            }),
          });
        }
      }
    }

    // Get updated market
    const [resolvedMarket] = await db
      .select()
      .from(markets)
      .where(eq(markets.id, id))
      .limit(1);

    return NextResponse.json({
      market: {
        ...resolvedMarket,
        yesPrice: parseFloat(resolvedMarket.yesPrice),
        noPrice: 1 - parseFloat(resolvedMarket.yesPrice),
        totalVolume: parseFloat(resolvedMarket.totalVolume),
      },
      payout: {
        resolution,
        positionsPaidOut: winningPositions.length,
        totalPaidOut,
      },
    });
  } catch (error) {
    console.error("Resolve market error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
