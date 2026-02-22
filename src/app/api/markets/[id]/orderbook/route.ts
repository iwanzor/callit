import { NextResponse } from "next/server";
import { getOrderBook } from "@/lib/matching";
import { db, markets } from "@/lib/db";
import { eq } from "drizzle-orm";

// GET /api/markets/[id]/orderbook - Get the order book for a market
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: marketId } = await params;

    // Validate market exists
    const [market] = await db
      .select({ id: markets.id, status: markets.status, yesPrice: markets.yesPrice })
      .from(markets)
      .where(eq(markets.id, marketId))
      .limit(1);

    if (!market) {
      return NextResponse.json({ error: "Market not found" }, { status: 404 });
    }

    // Get order book
    const orderBook = await getOrderBook(marketId);

    // Calculate spread
    const bestBid = orderBook.bids.length > 0 ? orderBook.bids[0].price : null;
    const bestAsk = orderBook.asks.length > 0 ? orderBook.asks[0].price : null;
    const spread = bestBid !== null && bestAsk !== null ? bestAsk - bestBid : null;

    return NextResponse.json({
      marketId,
      lastPrice: parseFloat(market.yesPrice),
      bids: orderBook.bids.map((b) => ({
        price: b.price,
        quantity: b.quantity,
        orders: b.orders,
      })),
      asks: orderBook.asks.map((a) => ({
        price: a.price,
        quantity: a.quantity,
        orders: a.orders,
      })),
      summary: {
        bestBid,
        bestAsk,
        spread,
        bidDepth: orderBook.bids.reduce((sum, b) => sum + b.quantity, 0),
        askDepth: orderBook.asks.reduce((sum, a) => sum + a.quantity, 0),
      },
    });
  } catch (error) {
    console.error("Error fetching order book:", error);
    return NextResponse.json({ error: "Failed to fetch order book" }, { status: 500 });
  }
}
