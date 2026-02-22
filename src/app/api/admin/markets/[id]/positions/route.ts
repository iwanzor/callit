import { NextRequest, NextResponse } from "next/server";
import { db, positions, users } from "@/lib/db";
import { eq, or, gt } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

type Params = Promise<{ id: string }>;

// GET /api/admin/markets/[id]/positions - Get all positions for a market
export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { id } = await params;
    
    // Auth check (optional for now)
    const user = await getCurrentUser(request);
    // In production, verify user.isAdmin

    // Get all positions for this market with user info
    const positionList = await db
      .select({
        userId: positions.userId,
        yesShares: positions.yesShares,
        noShares: positions.noShares,
        userEmail: users.email,
      })
      .from(positions)
      .leftJoin(users, eq(positions.userId, users.id))
      .where(
        eq(positions.marketId, id)
      );

    const transformedPositions = positionList
      .filter((p) => parseFloat(p.yesShares) > 0 || parseFloat(p.noShares) > 0)
      .map((p) => ({
        userId: p.userId,
        userEmail: p.userEmail || "Unknown",
        yesShares: parseFloat(p.yesShares),
        noShares: parseFloat(p.noShares),
      }));

    return NextResponse.json({ positions: transformedPositions });
  } catch (error) {
    console.error("Admin positions error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
