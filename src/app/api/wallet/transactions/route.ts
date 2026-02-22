import { NextRequest, NextResponse } from "next/server";
import { db, transactions } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

// GET /api/wallet/transactions - List user's transactions
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const offset = parseInt(searchParams.get("offset") || "0");
    const type = searchParams.get("type");

    // Build query
    let query = db
      .select({
        id: transactions.id,
        type: transactions.type,
        amount: transactions.amount,
        balanceAfter: transactions.balanceAfter,
        status: transactions.status,
        createdAt: transactions.createdAt,
        referenceType: transactions.referenceType,
        referenceId: transactions.referenceId,
      })
      .from(transactions)
      .where(eq(transactions.userId, currentUser.sub))
      .orderBy(desc(transactions.createdAt))
      .limit(limit)
      .offset(offset);

    const txList = await query;

    // Filter by type if specified
    let filteredTx = txList;
    if (type && ["deposit", "withdrawal", "trade_buy", "trade_sell", "payout", "fee", "refund"].includes(type)) {
      filteredTx = txList.filter((tx) => tx.type === type);
    }

    const transformedTransactions = filteredTx.map((tx) => ({
      id: tx.id,
      type: tx.type,
      amount: parseFloat(tx.amount),
      balanceAfter: parseFloat(tx.balanceAfter),
      status: tx.status,
      createdAt: tx.createdAt.toISOString(),
      referenceType: tx.referenceType,
      referenceId: tx.referenceId,
    }));

    return NextResponse.json({
      transactions: transformedTransactions,
      pagination: {
        limit,
        offset,
        hasMore: txList.length === limit,
      },
    });
  } catch (error) {
    console.error("Transactions error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
