import { NextRequest, NextResponse } from "next/server";
import { db, users, transactions } from "@/lib/db";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { getCurrentUser } from "@/lib/auth";

// POST /api/wallet/deposit - Add funds (mocked)
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
    const depositAmount = parseFloat(amount);
    if (isNaN(depositAmount) || depositAmount <= 0) {
      return NextResponse.json(
        { error: "Invalid amount. Must be a positive number." },
        { status: 400 }
      );
    }

    if (depositAmount > 10000) {
      return NextResponse.json(
        { error: "Maximum deposit is $10,000 per transaction." },
        { status: 400 }
      );
    }

    // Get current balance
    const [user] = await db
      .select({ balance: users.balance })
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
    const newBalance = currentBalance + depositAmount;

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
      type: "deposit",
      amount: depositAmount.toFixed(2),
      balanceAfter: newBalance.toFixed(2),
      paymentMethod: "mock",
      status: "completed",
      metadata: JSON.stringify({
        note: "Mocked deposit - instant credit",
      }),
    });

    return NextResponse.json({
      success: true,
      transaction: {
        id: transactionId,
        type: "deposit",
        amount: depositAmount,
        balanceAfter: newBalance,
        status: "completed",
      },
    });
  } catch (error) {
    console.error("Deposit error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
