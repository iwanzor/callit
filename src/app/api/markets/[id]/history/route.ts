import { NextRequest, NextResponse } from "next/server";
import { db, priceHistory, markets } from "@/lib/db";
import { eq, desc, and, gte, sql } from "drizzle-orm";

type Params = Promise<{ id: string }>;

// GET /api/markets/[id]/history - Get price history with interval aggregation
export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    
    const interval = searchParams.get("interval") || "1h"; // 1m, 5m, 1h, 1d
    const limit = Math.min(parseInt(searchParams.get("limit") || "500"), 1000);
    const range = searchParams.get("range") || "all"; // 1h, 6h, 24h, 7d, all

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

    // Calculate time range
    let fromTime: Date | null = null;
    const now = new Date();
    
    switch (range) {
      case "1h":
        fromTime = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case "6h":
        fromTime = new Date(now.getTime() - 6 * 60 * 60 * 1000);
        break;
      case "24h":
        fromTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case "7d":
        fromTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      default:
        fromTime = null;
    }

    // Get aggregated price history based on interval
    // For MVP, we'll just fetch raw data and aggregate client-side if needed
    // For production, you'd use SQL aggregation with date_trunc
    
    const conditions = [eq(priceHistory.marketId, id)];
    if (fromTime) {
      conditions.push(gte(priceHistory.timestamp, fromTime));
    }

    const history = await db
      .select({
        yesPrice: priceHistory.yesPrice,
        volume: priceHistory.volume,
        timestamp: priceHistory.timestamp,
      })
      .from(priceHistory)
      .where(and(...conditions))
      .orderBy(desc(priceHistory.timestamp))
      .limit(limit);

    // Transform to chart format - TradingView expects { time, value }
    const chartData = history
      .map((h) => ({
        time: Math.floor(new Date(h.timestamp).getTime() / 1000), // Unix timestamp in seconds
        yesPrice: parseFloat(h.yesPrice) * 100, // Convert to cents (0-100)
        noPrice: (1 - parseFloat(h.yesPrice)) * 100,
        volume: parseFloat(h.volume),
      }))
      .reverse(); // Oldest first for charts

    // Aggregate by interval if needed
    const aggregatedData = aggregateByInterval(chartData, interval);

    return NextResponse.json({
      marketId: id,
      interval,
      range,
      data: aggregatedData,
    });
  } catch (error) {
    console.error("Get price history error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Aggregate data points by interval
function aggregateByInterval(
  data: { time: number; yesPrice: number; noPrice: number; volume: number }[],
  interval: string
): { time: number; yesPrice: number; noPrice: number; volume: number }[] {
  if (data.length === 0) return data;

  // Get interval in seconds
  let intervalSeconds: number;
  switch (interval) {
    case "1m":
      intervalSeconds = 60;
      break;
    case "5m":
      intervalSeconds = 5 * 60;
      break;
    case "1h":
      intervalSeconds = 60 * 60;
      break;
    case "1d":
      intervalSeconds = 24 * 60 * 60;
      break;
    default:
      intervalSeconds = 60 * 60; // default 1h
  }

  // Group by interval buckets
  const buckets = new Map<number, { prices: number[]; volumes: number[] }>();

  for (const point of data) {
    const bucketTime = Math.floor(point.time / intervalSeconds) * intervalSeconds;
    if (!buckets.has(bucketTime)) {
      buckets.set(bucketTime, { prices: [], volumes: [] });
    }
    const bucket = buckets.get(bucketTime)!;
    bucket.prices.push(point.yesPrice);
    bucket.volumes.push(point.volume);
  }

  // Convert to aggregated data (using last price in bucket, sum of volumes)
  const result: { time: number; yesPrice: number; noPrice: number; volume: number }[] = [];
  
  const sortedKeys = Array.from(buckets.keys()).sort((a, b) => a - b);
  for (const time of sortedKeys) {
    const bucket = buckets.get(time)!;
    const lastPrice = bucket.prices[bucket.prices.length - 1];
    const totalVolume = bucket.volumes.reduce((a, b) => a + b, 0);
    
    result.push({
      time,
      yesPrice: lastPrice,
      noPrice: 100 - lastPrice,
      volume: totalVolume,
    });
  }

  return result;
}
