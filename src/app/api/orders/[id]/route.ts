import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { cancelOrder } from "@/lib/matching";
import { db, orders } from "@/lib/db";
import { eq, and } from "drizzle-orm";

// DELETE /api/orders/[id] - Cancel an order
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate user
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: orderId } = await params;

    // Validate order ID format (basic check)
    if (!orderId || orderId.length !== 36) {
      return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
    }

    // Cancel the order
    await cancelOrder(orderId, user.sub);

    return NextResponse.json({
      success: true,
      message: "Order cancelled successfully",
    });
  } catch (error) {
    console.error("Error cancelling order:", error);
    const message = error instanceof Error ? error.message : "Failed to cancel order";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

// GET /api/orders/[id] - Get a specific order
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate user
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: orderId } = await params;

    // Fetch the order
    const [order] = await db
      .select()
      .from(orders)
      .where(and(eq(orders.id, orderId), eq(orders.userId, user.sub)))
      .limit(1);

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({
      order: {
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
      },
    });
  } catch (error) {
    console.error("Error fetching order:", error);
    return NextResponse.json({ error: "Failed to fetch order" }, { status: 500 });
  }
}
