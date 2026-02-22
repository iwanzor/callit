// Load environment variables FIRST, before any imports that use them
import { config } from "dotenv";
config({ path: ".env.local" });

import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "../src/lib/db/schema";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";

const { users, markets, orders, positions, transactions } = schema;

// Create a fresh pool with env vars loaded
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "3306"),
  user: process.env.DB_USERNAME || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_DATABASE || "callit",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const db = drizzle(pool, { schema, mode: "default" });

// Helper to generate slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 100);
}

// Helper to generate random volume
function randomVolume(min: number, max: number): string {
  return (Math.random() * (max - min) + min).toFixed(2);
}

// Helper to generate random price between 0.15 and 0.85
function randomPrice(min = 0.15, max = 0.85): string {
  return (Math.random() * (max - min) + min).toFixed(2);
}

// Market data
const marketData = [
  // Politics
  {
    title: "Will Donald Trump win the 2028 US Presidential Election?",
    description: "This market will resolve to YES if Donald Trump wins the 2028 United States presidential election. The winner is determined by receiving 270 or more electoral college votes.",
    category: "politics",
    yesPrice: "0.35",
    totalVolume: randomVolume(500000, 5000000),
    closeAt: new Date("2028-11-05T00:00:00Z"),
    resolveAt: new Date("2028-11-10T00:00:00Z"),
  },
  {
    title: "Will there be a US government shutdown in 2026?",
    description: "Resolves YES if there is at least one partial or full US federal government shutdown lasting 24 hours or more during the calendar year 2026.",
    category: "politics",
    yesPrice: "0.42",
    totalVolume: randomVolume(100000, 800000),
    closeAt: new Date("2026-12-31T00:00:00Z"),
    resolveAt: new Date("2027-01-05T00:00:00Z"),
  },
  {
    title: "Will Ukraine join NATO by 2030?",
    description: "This market resolves YES if Ukraine becomes a full member of NATO by December 31, 2030.",
    category: "politics",
    yesPrice: "0.28",
    totalVolume: randomVolume(200000, 1500000),
    closeAt: new Date("2030-12-31T00:00:00Z"),
    resolveAt: new Date("2031-01-05T00:00:00Z"),
  },
  {
    title: "Will the UK rejoin the EU by 2030?",
    description: "Resolves YES if the United Kingdom becomes a full member of the European Union again by December 31, 2030.",
    category: "politics",
    yesPrice: "0.12",
    totalVolume: randomVolume(50000, 300000),
    closeAt: new Date("2030-12-31T00:00:00Z"),
    resolveAt: new Date("2031-01-05T00:00:00Z"),
  },

  // Crypto
  {
    title: "Will Bitcoin reach $200,000 by end of 2026?",
    description: "This market resolves YES if Bitcoin (BTC) reaches a price of $200,000 USD or higher on any major exchange (Coinbase, Binance, Kraken) at any point before January 1, 2027.",
    category: "crypto",
    yesPrice: "0.38",
    totalVolume: randomVolume(1000000, 5000000),
    closeAt: new Date("2026-12-31T23:59:59Z"),
    resolveAt: new Date("2027-01-02T00:00:00Z"),
  },
  {
    title: "Will Ethereum flip Bitcoin by market cap by 2028?",
    description: "Resolves YES if Ethereum's total market capitalization exceeds Bitcoin's market capitalization at any point before January 1, 2028, as reported by CoinMarketCap.",
    category: "crypto",
    yesPrice: "0.18",
    totalVolume: randomVolume(300000, 1500000),
    closeAt: new Date("2027-12-31T00:00:00Z"),
    resolveAt: new Date("2028-01-05T00:00:00Z"),
  },
  {
    title: "Will a country adopt Bitcoin as legal tender in 2026?",
    description: "This market resolves YES if any country (other than El Salvador or Central African Republic) officially adopts Bitcoin as legal tender in 2026.",
    category: "crypto",
    yesPrice: "0.25",
    totalVolume: randomVolume(100000, 600000),
    closeAt: new Date("2026-12-31T00:00:00Z"),
    resolveAt: new Date("2027-01-10T00:00:00Z"),
  },
  {
    title: "Will Solana surpass Ethereum in daily transactions by end of 2026?",
    description: "Resolves YES if Solana's average daily transactions exceed Ethereum's (including L2s) for any 30-day period in 2026.",
    category: "crypto",
    yesPrice: "0.55",
    totalVolume: randomVolume(200000, 900000),
    closeAt: new Date("2026-12-31T00:00:00Z"),
    resolveAt: new Date("2027-01-05T00:00:00Z"),
  },

  // Sports
  {
    title: "Will Real Madrid win Champions League 2025/26?",
    description: "This market resolves YES if Real Madrid wins the UEFA Champions League for the 2025/26 season.",
    category: "sports",
    yesPrice: "0.22",
    totalVolume: randomVolume(400000, 2000000),
    closeAt: new Date("2026-05-30T00:00:00Z"),
    resolveAt: new Date("2026-06-01T00:00:00Z"),
  },
  {
    title: "Will LeBron James retire before 2027?",
    description: "Resolves YES if LeBron James officially announces his retirement from professional basketball before January 1, 2027.",
    category: "sports",
    yesPrice: "0.15",
    totalVolume: randomVolume(150000, 700000),
    closeAt: new Date("2026-12-31T00:00:00Z"),
    resolveAt: new Date("2027-01-05T00:00:00Z"),
  },
  {
    title: "Will Manchester City win the Premier League 2025/26?",
    description: "This market resolves YES if Manchester City FC wins the English Premier League title for the 2025/26 season.",
    category: "sports",
    yesPrice: "0.32",
    totalVolume: randomVolume(300000, 1200000),
    closeAt: new Date("2026-05-25T00:00:00Z"),
    resolveAt: new Date("2026-05-28T00:00:00Z"),
  },

  // Economy
  {
    title: "Will US enter recession in 2026?",
    description: "Resolves YES if the National Bureau of Economic Research (NBER) officially declares a US recession that begins in 2026, or if GDP contracts for two consecutive quarters in 2026.",
    category: "economy",
    yesPrice: "0.32",
    totalVolume: randomVolume(500000, 2500000),
    closeAt: new Date("2026-12-31T00:00:00Z"),
    resolveAt: new Date("2027-03-01T00:00:00Z"),
  },
  {
    title: "Will Fed cut rates below 3% by end of 2026?",
    description: "This market resolves YES if the Federal Reserve's target federal funds rate falls below 3.00% at any point before January 1, 2027.",
    category: "economy",
    yesPrice: "0.58",
    totalVolume: randomVolume(400000, 1800000),
    closeAt: new Date("2026-12-31T00:00:00Z"),
    resolveAt: new Date("2027-01-02T00:00:00Z"),
  },
  {
    title: "Will Tesla stock exceed $500 by July 2026?",
    description: "Resolves YES if Tesla Inc. (TSLA) stock price reaches $500 or higher on the NASDAQ at any point before July 1, 2026.",
    category: "economy",
    yesPrice: "0.45",
    totalVolume: randomVolume(600000, 2200000),
    closeAt: new Date("2026-06-30T00:00:00Z"),
    resolveAt: new Date("2026-07-02T00:00:00Z"),
  },
  {
    title: "Will US inflation fall below 2% in 2026?",
    description: "Resolves YES if the US Consumer Price Index (CPI) year-over-year inflation rate falls below 2.0% for any month in 2026.",
    category: "economy",
    yesPrice: "0.35",
    totalVolume: randomVolume(200000, 800000),
    closeAt: new Date("2026-12-31T00:00:00Z"),
    resolveAt: new Date("2027-01-15T00:00:00Z"),
  },

  // Entertainment
  {
    title: "Will GTA 6 release before June 2026?",
    description: "This market resolves YES if Grand Theft Auto VI is officially released for any platform before June 1, 2026. Early access or beta releases do not count.",
    category: "entertainment",
    yesPrice: "0.72",
    totalVolume: randomVolume(800000, 3000000),
    closeAt: new Date("2026-05-31T00:00:00Z"),
    resolveAt: new Date("2026-06-02T00:00:00Z"),
  },
  {
    title: "Will an AI-generated song win a Grammy by 2028?",
    description: "Resolves YES if a song primarily composed or performed by artificial intelligence wins a Grammy Award at the ceremony in 2027 or 2028.",
    category: "entertainment",
    yesPrice: "0.15",
    totalVolume: randomVolume(100000, 500000),
    closeAt: new Date("2028-02-28T00:00:00Z"),
    resolveAt: new Date("2028-03-05T00:00:00Z"),
  },

  // Science
  {
    title: "Will SpaceX land humans on Mars by 2030?",
    description: "This market resolves YES if SpaceX successfully lands at least one human on the surface of Mars before January 1, 2031. The human(s) must survive the landing.",
    category: "science",
    yesPrice: "0.18",
    totalVolume: randomVolume(500000, 2000000),
    closeAt: new Date("2030-12-31T00:00:00Z"),
    resolveAt: new Date("2031-01-05T00:00:00Z"),
  },
  {
    title: "Will nuclear fusion achieve net energy gain commercially by 2030?",
    description: "Resolves YES if a commercial nuclear fusion reactor achieves net energy gain (Q > 1) and announces plans for commercial deployment before January 1, 2031.",
    category: "science",
    yesPrice: "0.22",
    totalVolume: randomVolume(150000, 700000),
    closeAt: new Date("2030-12-31T00:00:00Z"),
    resolveAt: new Date("2031-01-10T00:00:00Z"),
  },
  {
    title: "Will a lab-grown meat company IPO in 2026?",
    description: "Resolves YES if any cultivated/lab-grown meat company completes an initial public offering on a major stock exchange (NYSE, NASDAQ, LSE) in 2026.",
    category: "science",
    yesPrice: "0.40",
    totalVolume: randomVolume(50000, 250000),
    closeAt: new Date("2026-12-31T00:00:00Z"),
    resolveAt: new Date("2027-01-05T00:00:00Z"),
  },
];

// Seed users
async function seedUsers() {
  console.log("🌱 Seeding users...");

  const adminId = uuidv4();
  const demoId = uuidv4();

  // Hash passwords
  const adminPasswordHash = await bcrypt.hash("admin123", 10);
  const demoPasswordHash = await bcrypt.hash("demo123", 10);

  // Check if users already exist
  const existingAdmin = await db.select().from(users).where(eq(users.email, "admin@callit.io")).limit(1);
  const existingDemo = await db.select().from(users).where(eq(users.email, "demo@callit.io")).limit(1);

  if (existingAdmin.length === 0) {
    await db.insert(users).values({
      id: adminId,
      email: "admin@callit.io",
      passwordHash: adminPasswordHash,
      displayName: "Admin User",
      authProvider: "email",
      kycStatus: "verified",
      isAdmin: true,
      balance: "100000.00",
      frozenBalance: "0.00",
    });
    console.log("  ✅ Created admin@callit.io");
  } else {
    console.log("  ⏭️  admin@callit.io already exists");
  }

  if (existingDemo.length === 0) {
    await db.insert(users).values({
      id: demoId,
      email: "demo@callit.io",
      passwordHash: demoPasswordHash,
      displayName: "Demo Trader",
      authProvider: "email",
      kycStatus: "verified",
      isAdmin: false,
      balance: "1000.00",
      frozenBalance: "0.00",
    });
    console.log("  ✅ Created demo@callit.io");
  } else {
    console.log("  ⏭️  demo@callit.io already exists");
  }

  // Fetch the actual IDs (in case they already existed)
  const [admin] = await db.select().from(users).where(eq(users.email, "admin@callit.io")).limit(1);
  const [demo] = await db.select().from(users).where(eq(users.email, "demo@callit.io")).limit(1);

  return { adminId: admin.id, demoId: demo.id };
}

// Seed markets
async function seedMarkets(adminId: string) {
  console.log("🌱 Seeding markets...");

  const createdMarkets: { id: string; title: string; yesPrice: string }[] = [];

  for (const market of marketData) {
    const slug = generateSlug(market.title);
    
    // Check if market already exists
    const existing = await db.select().from(markets).where(eq(markets.slug, slug)).limit(1);
    
    if (existing.length === 0) {
      const id = uuidv4();
      await db.insert(markets).values({
        id,
        slug,
        title: market.title,
        description: market.description,
        category: market.category,
        status: "open",
        yesPrice: market.yesPrice,
        totalVolume: market.totalVolume,
        totalYesShares: (parseFloat(market.totalVolume) * 0.6).toFixed(2),
        totalNoShares: (parseFloat(market.totalVolume) * 0.4).toFixed(2),
        closeAt: market.closeAt,
        resolveAt: market.resolveAt,
        createdBy: adminId,
      });
      createdMarkets.push({ id, title: market.title, yesPrice: market.yesPrice });
      console.log(`  ✅ Created: ${market.title.slice(0, 50)}...`);
    } else {
      createdMarkets.push({ id: existing[0].id, title: market.title, yesPrice: market.yesPrice });
      console.log(`  ⏭️  Already exists: ${market.title.slice(0, 50)}...`);
    }
  }

  return createdMarkets;
}

// Seed orders and positions for demo user
async function seedOrdersAndPositions(
  demoId: string, 
  marketsList: { id: string; title: string; yesPrice: string }[]
) {
  console.log("🌱 Seeding orders and positions for demo user...");

  // Check if positions already exist for demo user
  const existingPosition = await db
    .select()
    .from(positions)
    .where(eq(positions.userId, demoId))
    .limit(1);

  if (existingPosition.length > 0) {
    console.log("  ⏭️  Positions already exist for demo user, skipping...");
    return;
  }

  // Pick 8 markets for the demo user to have positions in
  const selectedMarkets = marketsList.slice(0, 8);

  for (const market of selectedMarkets) {
    const positionId = uuidv4();
    
    // Random position (either YES or NO shares)
    const hasYes = Math.random() > 0.4;
    const hasNo = Math.random() > 0.6;
    
    const yesShares = hasYes ? (Math.random() * 50 + 10).toFixed(2) : "0.00";
    const noShares = hasNo ? (Math.random() * 30 + 5).toFixed(2) : "0.00";
    
    if (parseFloat(yesShares) > 0 || parseFloat(noShares) > 0) {
      await db.insert(positions).values({
        id: positionId,
        userId: demoId,
        marketId: market.id,
        yesShares,
        noShares,
        avgYesPrice: hasYes ? market.yesPrice : null,
        avgNoPrice: hasNo ? (1 - parseFloat(market.yesPrice)).toFixed(2) : null,
        realizedPnl: "0.00",
      });
      console.log(`  ✅ Created position: ${market.title.slice(0, 40)}...`);
    }

    // Create some filled orders for history
    if (hasYes) {
      const orderId = uuidv4();
      await db.insert(orders).values({
        id: orderId,
        userId: demoId,
        marketId: market.id,
        side: "yes",
        type: "limit",
        price: market.yesPrice,
        quantity: yesShares,
        filledQuantity: yesShares,
        remainingQty: "0.00",
        status: "filled",
      });
    }

    if (hasNo) {
      const orderId = uuidv4();
      await db.insert(orders).values({
        id: orderId,
        userId: demoId,
        marketId: market.id,
        side: "no",
        type: "limit",
        price: (1 - parseFloat(market.yesPrice)).toFixed(2),
        quantity: noShares,
        filledQuantity: noShares,
        remainingQty: "0.00",
        status: "filled",
      });
    }
  }

  // Create a deposit transaction
  const txId = uuidv4();
  await db.insert(transactions).values({
    id: txId,
    userId: demoId,
    type: "deposit",
    amount: "1500.00",
    balanceAfter: "1000.00",
    referenceType: "seed",
    referenceId: "seed-initial",
    paymentMethod: "bank_transfer",
    status: "completed",
  });
  console.log("  ✅ Created deposit transaction");
}

// Add one resolved market
async function seedResolvedMarket(adminId: string) {
  console.log("🌱 Seeding resolved market...");
  
  const slug = "will-bitcoin-reach-100k-by-end-of-2024";
  const existing = await db.select().from(markets).where(eq(markets.slug, slug)).limit(1);
  
  if (existing.length === 0) {
    const id = uuidv4();
    await db.insert(markets).values({
      id,
      slug,
      title: "Will Bitcoin reach $100,000 by end of 2024?",
      description: "This market resolved YES after Bitcoin surpassed $100,000 in December 2024.",
      category: "crypto",
      status: "resolved",
      resolution: "yes",
      yesPrice: "1.00",
      totalVolume: "4250000.00",
      totalYesShares: "2500000.00",
      totalNoShares: "1750000.00",
      closeAt: new Date("2024-12-31T23:59:59Z"),
      resolveAt: new Date("2025-01-02T00:00:00Z"),
      resolvedBy: adminId,
      resolvedAtActual: new Date("2024-12-05T14:30:00Z"),
      resolutionSource: "CoinMarketCap, Binance, Coinbase price data",
      createdBy: adminId,
    });
    console.log("  ✅ Created resolved market: BTC $100K 2024");
  } else {
    console.log("  ⏭️  Resolved market already exists");
  }
}

// Main seed function
async function main() {
  console.log("🚀 Starting Callit database seed...\n");
  console.log(`📍 Connecting to: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_DATABASE}\n`);

  try {
    const { adminId, demoId } = await seedUsers();
    console.log("");
    
    const createdMarkets = await seedMarkets(adminId);
    console.log("");
    
    await seedOrdersAndPositions(demoId, createdMarkets);
    console.log("");
    
    await seedResolvedMarket(adminId);
    console.log("");
    
    console.log("✅ Seed completed successfully!");
    console.log(`
📊 Summary:
   - 2 users (admin@callit.io, demo@callit.io)
   - ${marketData.length} active markets
   - 1 resolved market
   - Positions and orders for demo user
   
🔑 Test Credentials:
   Admin: admin@callit.io / admin123
   Demo:  demo@callit.io / demo123
`);
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  }

  // Close the pool
  await pool.end();
  process.exit(0);
}

main();
