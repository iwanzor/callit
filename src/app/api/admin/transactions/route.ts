import { NextRequest, NextResponse } from "next/server";
import { db, transactions, users } from "@/lib/db";
import { desc, eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

// GET /api/admin/transactions - List all transactions
export async function GET(request: NextRequest) {
  try {
    // Auth check (optional for now)
    const user = await getCurrentUser(request);
    // In production, verify user.isAdmin

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "100"), 500);
    const offset = parseInt(searchParams.get("offset") || "0");

    // Get transactions with user emails
    const txList = await db
      .select({
        id: transactions.id,
        userId: transactions.userId,
        type: transactions.type,
        amount: transactions.amount,
        balanceAfter: transactions.balanceAfter,
        status: transactions.status,
        createdAt: transactions.createdAt,
        referenceType: transactions.referenceType,
        referenceId: transactions.referenceId,
        userEmail: users.email,
      })
      .from(transactions)
      .leftJoin(users, eq(transactions.userId, users.id))
      .orderBy(desc(transactions.createdAt))
      .limit(limit)
      .offset(offset);

    const transformedTransactions = txList.map((tx) => ({
      id: tx.id,
      userId: tx.userId,
      userEmail: tx.userEmail || "Unknown",
      type: tx.type,
      amount: parseFloat(tx.amount),
      balanceAfter: parseFloat(tx.balanceAfter),
      status: tx.status,
      createdAt: tx.createdAt.toISOString(),
      referenceType: tx.referenceType,
      referenceId: tx.referenceId,
    }));

    return NextResponse.json({ transactions: transformedTransactions });
  } catch (error) {
    console.error("Admin transactions error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
