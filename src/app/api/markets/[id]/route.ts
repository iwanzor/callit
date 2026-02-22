import { NextRequest, NextResponse } from "next/server";
import { db, markets, orders, priceHistory } from "@/lib/db";
import { eq, desc, and, asc } from "drizzle-orm";

type Params = Promise<{ id: string }>;

// GET /api/markets/[id] - Get single market details
export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { id } = await params;

    // Find market by id or slug
    const [market] = await db
      .select()
      .from(markets)
      .where(eq(markets.id, id))
      .limit(1);

    if (!market) {
      // Try finding by slug
      const [marketBySlug] = await db
        .select()
        .from(markets)
        .where(eq(markets.slug, id))
        .limit(1);

      if (!marketBySlug) {
        return NextResponse.json(
          { error: "Market not found" },
          { status: 404 }
        );
      }

      return formatMarketResponse(marketBySlug);
    }

    return formatMarketResponse(market);
  } catch (error) {
    console.error("Get market error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function formatMarketResponse(market: typeof markets.$inferSelect) {
  // Get recent price history
  const history = await db
    .select({
      yesPrice: priceHistory.yesPrice,
      volume: priceHistory.volume,
      timestamp: priceHistory.timestamp,
    })
    .from(priceHistory)
    .where(eq(priceHistory.marketId, market.id))
    .orderBy(desc(priceHistory.timestamp))
    .limit(100);

  // Get order book (open orders)
  const openOrders = await db
    .select({
      side: orders.side,
      price: orders.price,
      remainingQty: orders.remainingQty,
    })
    .from(orders)
    .where(
      and(
        eq(orders.marketId, market.id),
        eq(orders.status, "open")
      )
    )
    .orderBy(asc(orders.price));

  // Aggregate order book by price level
  const yesBids: Record<string, number> = {};
  const noBids: Record<string, number> = {};

  openOrders.forEach((order) => {
    const price = order.price;
    const qty = parseFloat(order.remainingQty);
    if (order.side === "yes") {
      yesBids[price] = (yesBids[price] || 0) + qty;
    } else {
      noBids[price] = (noBids[price] || 0) + qty;
    }
  });

  const orderBook = {
    yes: Object.entries(yesBids)
      .map(([price, quantity]) => ({ price: parseFloat(price), quantity }))
      .sort((a, b) => b.price - a.price),
    no: Object.entries(noBids)
      .map(([price, quantity]) => ({ price: parseFloat(price), quantity }))
      .sort((a, b) => b.price - a.price),
  };

  return NextResponse.json({
    market: {
      id: market.id,
      slug: market.slug,
      title: market.title,
      description: market.description,
      category: market.category,
      status: market.status,
      resolution: market.resolution,
      yesPrice: parseFloat(market.yesPrice),
      noPrice: 1 - parseFloat(market.yesPrice),
      totalVolume: parseFloat(market.totalVolume),
      totalYesShares: parseFloat(market.totalYesShares),
      totalNoShares: parseFloat(market.totalNoShares),
      openAt: market.openAt,
      closeAt: market.closeAt,
      resolveAt: market.resolveAt,
      resolvedAtActual: market.resolvedAtActual,
      resolutionSource: market.resolutionSource,
      imageUrl: market.imageUrl,
      createdAt: market.createdAt,
      updatedAt: market.updatedAt,
    },
    priceHistory: history.map((h) => ({
      yesPrice: parseFloat(h.yesPrice),
      volume: parseFloat(h.volume),
      timestamp: h.timestamp,
    })).reverse(),
    orderBook,
  });
}
