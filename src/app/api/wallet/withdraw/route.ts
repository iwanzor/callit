import { NextRequest, NextResponse } from "next/server";
import { db, users, transactions } from "@/lib/db";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { getCurrentUser } from "@/lib/auth";

// POST /api/wallet/withdraw - Withdraw funds (mocked)
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { amount } = body;

    // Validate amount
    const withdrawAmount = parseFloat(amount);
    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
      return NextResponse.json(
        { error: "Invalid amount. Must be a positive number." },
        { status: 400 }
      );
    }

    if (withdrawAmount < 10) {
      return NextResponse.json(
        { error: "Minimum withdrawal is $10." },
        { status: 400 }
      );
    }

    // Get current balance and frozen balance
    const [user] = await db
      .select({
        balance: users.balance,
        frozenBalance: users.frozenBalance,
      })
      .from(users)
      .where(eq(users.id, currentUser.sub))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const currentBalance = parseFloat(user.balance);
    const frozenBalance = parseFloat(user.frozenBalance);
    const availableBalance = currentBalance - frozenBalance;

    // Check if user has enough available balance
    if (withdrawAmount > availableBalance) {
      return NextResponse.json(
        {
          error: `Insufficient funds. Available balance: $${availableBalance.toFixed(2)}`,
        },
        { status: 400 }
      );
    }

    const newBalance = currentBalance - withdrawAmount;

    // Update balance
    await db
      .update(users)
      .set({ balance: newBalance.toFixed(2) })
      .where(eq(users.id, currentUser.sub));

    // Create transaction record
    const transactionId = uuidv4();
    await db.insert(transactions).values({
      id: transactionId,
      userId: currentUser.sub,
      type: "withdrawal",
      amount: withdrawAmount.toFixed(2),
      balanceAfter: newBalance.toFixed(2),
      paymentMethod: "mock",
      status: "completed",
      metadata: JSON.stringify({
        note: "Mocked withdrawal - instant processing",
      }),
    });

    return NextResponse.json({
      success: true,
      transaction: {
        id: transactionId,
        type: "withdrawal",
        amount: withdrawAmount,
        balanceAfter: newBalance,
        status: "completed",
      },
    });
  } catch (error) {
    console.error("Withdraw error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
