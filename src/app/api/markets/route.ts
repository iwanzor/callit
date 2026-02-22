import { NextRequest, NextResponse } from "next/server";
import { db, markets } from "@/lib/db";
import { eq, and, like, or, desc, asc, sql } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

const VALID_CATEGORIES = ["sports", "politics", "crypto", "economy", "entertainment", "other"];
const VALID_STATUSES = ["draft", "open", "closed", "resolved", "cancelled"];

// GET /api/markets - List markets with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const status = searchParams.get("status") || "open";
    const search = searchParams.get("search");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const offset = parseInt(searchParams.get("offset") || "0");

    // Build conditions
    const conditions = [];

    if (status && VALID_STATUSES.includes(status)) {
      conditions.push(eq(markets.status, status as any));
    }

    if (category && VALID_CATEGORIES.includes(category)) {
      conditions.push(eq(markets.category, category));
    }

    if (search) {
      conditions.push(
        or(
          like(markets.title, `%${search}%`),
          like(markets.description, `%${search}%`)
        )
      );
    }

    // Build query
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(markets)
      .where(whereClause);
    const total = Number(countResult[0]?.count || 0);

    // Get markets
    const orderColumn = sortBy === "volume" ? markets.totalVolume :
                       sortBy === "closeAt" ? markets.closeAt :
                       sortBy === "yesPrice" ? markets.yesPrice :
                       markets.createdAt;
    
    const orderFn = sortOrder === "asc" ? asc : desc;

    const marketList = await db
      .select({
        id: markets.id,
        slug: markets.slug,
        title: markets.title,
        description: markets.description,
        category: markets.category,
        status: markets.status,
        resolution: markets.resolution,
        yesPrice: markets.yesPrice,
        totalVolume: markets.totalVolume,
        totalYesShares: markets.totalYesShares,
        totalNoShares: markets.totalNoShares,
        closeAt: markets.closeAt,
        imageUrl: markets.imageUrl,
        createdAt: markets.createdAt,
      })
      .from(markets)
      .where(whereClause)
      .orderBy(orderFn(orderColumn))
      .limit(limit)
      .offset(offset);

    // Transform prices to numbers
    const transformedMarkets = marketList.map((m) => ({
      ...m,
      yesPrice: parseFloat(m.yesPrice),
      noPrice: 1 - parseFloat(m.yesPrice),
      totalVolume: parseFloat(m.totalVolume),
      totalYesShares: parseFloat(m.totalYesShares),
      totalNoShares: parseFloat(m.totalNoShares),
    }));

    return NextResponse.json({
      markets: transformedMarkets,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + marketList.length < total,
      },
    });
  } catch (error) {
    console.error("List markets error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/markets - Create a new market (admin only, auth skipped for now)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, category, closeAt, resolveAt, imageUrl } = body;

    // Validation
    if (!title || typeof title !== "string" || title.length < 10) {
      return NextResponse.json(
        { error: "Title must be at least 10 characters" },
        { status: 400 }
      );
    }

    if (category && !VALID_CATEGORIES.includes(category)) {
      return NextResponse.json(
        { error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(", ")}` },
        { status: 400 }
      );
    }

    // Generate slug from title
    const baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 100);
    
    const slug = `${baseSlug}-${Date.now().toString(36)}`;
    const id = uuidv4();

    // For now, use a placeholder admin ID since we're skipping auth
    const createdBy = "admin";

    await db.insert(markets).values({
      id,
      slug,
      title,
      description: description || null,
      category: category || "other",
      status: "open",
      yesPrice: "0.50",
      totalVolume: "0.00",
      totalYesShares: "0.00",
      totalNoShares: "0.00",
      closeAt: closeAt ? new Date(closeAt) : null,
      resolveAt: resolveAt ? new Date(resolveAt) : null,
      imageUrl: imageUrl || null,
      createdBy,
    });

    const [newMarket] = await db
      .select()
      .from(markets)
      .where(eq(markets.id, id))
      .limit(1);

    return NextResponse.json({
      market: {
        ...newMarket,
        yesPrice: parseFloat(newMarket.yesPrice),
        noPrice: 1 - parseFloat(newMarket.yesPrice),
        totalVolume: parseFloat(newMarket.totalVolume),
      },
    }, { status: 201 });
  } catch (error) {
    console.error("Create market error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
