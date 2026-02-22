import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createOrderSchema } from "@/lib/validations";
import { matchOrder } from "@/lib/matching";
import { db, orders } from "@/lib/db";
import { eq, and, or } from "drizzle-orm";

// POST /api/orders - Place a new order
export async function POST(request: Request) {
  try {
    // Authenticate user
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = createOrderSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { marketId, side, type, price, quantity } = validation.data;

    // Validate price requirement for limit orders
    if (type === "limit" && (price === undefined || price === null)) {
      return NextResponse.json(
        { error: "Price is required for limit orders" },
        { status: 400 }
      );
    }

    // For market orders, use a placeholder price (will be determined by matching)
    const orderPrice = type === "limit" ? price! : 0.50;

    // Execute the order through matching engine
    const result = await matchOrder(
      user.sub,
      marketId,
      side,
      type,
      orderPrice,
      quantity
    );

    return NextResponse.json({
      success: true,
      order: {
        id: result.orderId,
        status: result.status,
        remainingQuantity: result.remainingQuantity,
        tradesExecuted: result.trades.length,
      },
      trades: result.trades.map((t) => ({
        id: t.tradeId,
        price: t.price,
        quantity: t.quantity,
      })),
    });
  } catch (error) {
    console.error("Error placing order:", error);
    const message = error instanceof Error ? error.message : "Failed to place order";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

// GET /api/orders - Get user's open orders
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
    const status = searchParams.get("status"); // open, filled, partial, cancelled, all

    // Build query conditions
    const conditions = [eq(orders.userId, user.sub)];

    if (marketId) {
      conditions.push(eq(orders.marketId, marketId));
    }

    if (status && status !== "all") {
      if (status === "active") {
        conditions.push(or(eq(orders.status, "open"), eq(orders.status, "partial"))!);
      } else {
        conditions.push(eq(orders.status, status as "open" | "filled" | "partial" | "cancelled"));
      }
    }

    // Fetch orders
    const userOrders = await db
      .select()
      .from(orders)
      .where(and(...conditions))
      .orderBy(orders.createdAt);

    return NextResponse.json({
      orders: userOrders.map((order) => ({
        id: order.id,
        marketId: order.marketId,
        side: order.side,
        type: order.type,
        price: parseFloat(order.price),
        quantity: parseFloat(order.quantity),
        filledQuantity: parseFloat(order.filledQuantity),
        remainingQuantity: parseFloat(order.remainingQty),
        status: order.status,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      })),
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}
