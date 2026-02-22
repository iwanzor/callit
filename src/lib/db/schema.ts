import {
  mysqlTable,
  varchar,
  text,
  decimal,
  boolean,
  timestamp,
  mysqlEnum,
  uniqueIndex,
  index,
  int,
  json,
} from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

// Users table
export const users = mysqlTable(
  "users",
  {
    id: varchar("id", { length: 36 }).primaryKey(), // UUID
    email: varchar("email", { length: 255 }).notNull().unique(),
    passwordHash: varchar("password_hash", { length: 255 }),
    displayName: varchar("display_name", { length: 100 }),
    authProvider: mysqlEnum("auth_provider", ["email", "google"])
      .notNull()
      .default("email"),
    kycStatus: mysqlEnum("kyc_status", [
      "none",
      "pending",
      "verified",
      "rejected",
    ])
      .notNull()
      .default("none"),
    isAdmin: boolean("is_admin").notNull().default(false),
    balance: decimal("balance", { precision: 18, scale: 2 })
      .notNull()
      .default("0.00"),
    frozenBalance: decimal("frozen_balance", { precision: 18, scale: 2 })
      .notNull()
      .default("0.00"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
  },
  (table) => [uniqueIndex("email_idx").on(table.email)]
);

// Markets table
export const markets = mysqlTable(
  "markets",
  {
    id: varchar("id", { length: 36 }).primaryKey(), // UUID
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    title: varchar("title", { length: 500 }).notNull(),
    description: text("description"),
    category: varchar("category", { length: 100 }),
    status: mysqlEnum("status", [
      "draft",
      "open",
      "closed",
      "resolved",
      "cancelled",
    ])
      .notNull()
      .default("draft"),
    resolution: mysqlEnum("resolution", ["yes", "no"]),
    yesPrice: decimal("yes_price", { precision: 4, scale: 2 })
      .notNull()
      .default("0.50"),
    // noPrice is computed as 1 - yesPrice in application logic
    totalVolume: decimal("total_volume", { precision: 18, scale: 2 })
      .notNull()
      .default("0.00"),
    totalYesShares: decimal("total_yes_shares", { precision: 18, scale: 2 })
      .notNull()
      .default("0.00"),
    totalNoShares: decimal("total_no_shares", { precision: 18, scale: 2 })
      .notNull()
      .default("0.00"),
    openAt: timestamp("open_at"),
    closeAt: timestamp("close_at"),
    resolveAt: timestamp("resolve_at"),
    resolvedBy: varchar("resolved_by", { length: 36 }),
    resolvedAtActual: timestamp("resolved_at_actual"),
    resolutionSource: text("resolution_source"),
    imageUrl: varchar("image_url", { length: 500 }),
    createdBy: varchar("created_by", { length: 36 }).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
  },
  (table) => [
    uniqueIndex("slug_idx").on(table.slug),
    index("status_idx").on(table.status),
    index("category_idx").on(table.category),
  ]
);

// Orders table
export const orders = mysqlTable(
  "orders",
  {
    id: varchar("id", { length: 36 }).primaryKey(), // UUID
    userId: varchar("user_id", { length: 36 }).notNull(),
    marketId: varchar("market_id", { length: 36 }).notNull(),
    side: mysqlEnum("side", ["yes", "no"]).notNull(),
    type: mysqlEnum("type", ["limit", "market"]).notNull(),
    price: decimal("price", { precision: 4, scale: 2 }).notNull(),
    quantity: decimal("quantity", { precision: 18, scale: 2 }).notNull(),
    filledQuantity: decimal("filled_quantity", { precision: 18, scale: 2 })
      .notNull()
      .default("0.00"),
    remainingQty: decimal("remaining_qty", { precision: 18, scale: 2 })
      .notNull()
      .default("0.00"),
    status: mysqlEnum("status", ["open", "filled", "partial", "cancelled"])
      .notNull()
      .default("open"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
  },
  (table) => [
    index("user_id_idx").on(table.userId),
    index("market_id_idx").on(table.marketId),
    index("status_idx").on(table.status),
  ]
);

// Trades table
export const trades = mysqlTable(
  "trades",
  {
    id: varchar("id", { length: 36 }).primaryKey(), // UUID
    marketId: varchar("market_id", { length: 36 }).notNull(),
    buyOrderId: varchar("buy_order_id", { length: 36 }).notNull(),
    sellOrderId: varchar("sell_order_id", { length: 36 }).notNull(),
    buyerId: varchar("buyer_id", { length: 36 }).notNull(),
    sellerId: varchar("seller_id", { length: 36 }).notNull(),
    side: mysqlEnum("side", ["yes", "no"]).notNull(),
    price: decimal("price", { precision: 4, scale: 2 }).notNull(),
    quantity: decimal("quantity", { precision: 18, scale: 2 }).notNull(),
    feeBuyer: decimal("fee_buyer", { precision: 18, scale: 2 })
      .notNull()
      .default("0.00"),
    feeSeller: decimal("fee_seller", { precision: 18, scale: 2 })
      .notNull()
      .default("0.00"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("market_id_idx").on(table.marketId),
    index("buyer_id_idx").on(table.buyerId),
    index("seller_id_idx").on(table.sellerId),
  ]
);

// Positions table
export const positions = mysqlTable(
  "positions",
  {
    id: varchar("id", { length: 36 }).primaryKey(), // UUID
    userId: varchar("user_id", { length: 36 }).notNull(),
    marketId: varchar("market_id", { length: 36 }).notNull(),
    yesShares: decimal("yes_shares", { precision: 18, scale: 2 })
      .notNull()
      .default("0.00"),
    noShares: decimal("no_shares", { precision: 18, scale: 2 })
      .notNull()
      .default("0.00"),
    avgYesPrice: decimal("avg_yes_price", { precision: 4, scale: 2 }),
    avgNoPrice: decimal("avg_no_price", { precision: 4, scale: 2 }),
    realizedPnl: decimal("realized_pnl", { precision: 18, scale: 2 })
      .notNull()
      .default("0.00"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
  },
  (table) => [
    uniqueIndex("user_market_idx").on(table.userId, table.marketId),
    index("user_id_idx").on(table.userId),
    index("market_id_idx").on(table.marketId),
  ]
);

// Transactions table (ledger)
export const transactions = mysqlTable(
  "transactions",
  {
    id: varchar("id", { length: 36 }).primaryKey(), // UUID
    userId: varchar("user_id", { length: 36 }).notNull(),
    type: mysqlEnum("type", [
      "deposit",
      "withdrawal",
      "trade_buy",
      "trade_sell",
      "payout",
      "fee",
      "refund",
    ]).notNull(),
    amount: decimal("amount", { precision: 18, scale: 2 }).notNull(),
    balanceAfter: decimal("balance_after", { precision: 18, scale: 2 }).notNull(),
    referenceType: varchar("reference_type", { length: 50 }),
    referenceId: varchar("reference_id", { length: 36 }),
    paymentMethod: varchar("payment_method", { length: 50 }),
    externalTxId: varchar("external_tx_id", { length: 255 }),
    status: mysqlEnum("status", ["pending", "completed", "failed"])
      .notNull()
      .default("completed"),
    metadata: json("metadata"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("user_id_idx").on(table.userId),
    index("type_idx").on(table.type),
    index("status_idx").on(table.status),
  ]
);

// Price history table
export const priceHistory = mysqlTable(
  "price_history",
  {
    id: int("id").primaryKey().autoincrement(),
    marketId: varchar("market_id", { length: 36 }).notNull(),
    yesPrice: decimal("yes_price", { precision: 4, scale: 2 }).notNull(),
    volume: decimal("volume", { precision: 18, scale: 2 })
      .notNull()
      .default("0.00"),
    timestamp: timestamp("timestamp").notNull().defaultNow(),
  },
  (table) => [
    index("market_id_idx").on(table.marketId),
    index("timestamp_idx").on(table.timestamp),
  ]
);

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
  positions: many(positions),
  transactions: many(transactions),
  createdMarkets: many(markets),
}));

export const marketsRelations = relations(markets, ({ one, many }) => ({
  creator: one(users, {
    fields: [markets.createdBy],
    references: [users.id],
  }),
  resolver: one(users, {
    fields: [markets.resolvedBy],
    references: [users.id],
  }),
  orders: many(orders),
  trades: many(trades),
  positions: many(positions),
  priceHistory: many(priceHistory),
}));

export const ordersRelations = relations(orders, ({ one }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  market: one(markets, {
    fields: [orders.marketId],
    references: [markets.id],
  }),
}));

export const tradesRelations = relations(trades, ({ one }) => ({
  market: one(markets, {
    fields: [trades.marketId],
    references: [markets.id],
  }),
  buyer: one(users, {
    fields: [trades.buyerId],
    references: [users.id],
  }),
  seller: one(users, {
    fields: [trades.sellerId],
    references: [users.id],
  }),
  buyOrder: one(orders, {
    fields: [trades.buyOrderId],
    references: [orders.id],
  }),
  sellOrder: one(orders, {
    fields: [trades.sellOrderId],
    references: [orders.id],
  }),
}));

export const positionsRelations = relations(positions, ({ one }) => ({
  user: one(users, {
    fields: [positions.userId],
    references: [users.id],
  }),
  market: one(markets, {
    fields: [positions.marketId],
    references: [markets.id],
  }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
}));

export const priceHistoryRelations = relations(priceHistory, ({ one }) => ({
  market: one(markets, {
    fields: [priceHistory.marketId],
    references: [markets.id],
  }),
}));

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Market = typeof markets.$inferSelect;
export type NewMarket = typeof markets.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type Trade = typeof trades.$inferSelect;
export type NewTrade = typeof trades.$inferInsert;
export type Position = typeof positions.$inferSelect;
export type NewPosition = typeof positions.$inferInsert;
export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
export type PriceHistory = typeof priceHistory.$inferSelect;
export type NewPriceHistory = typeof priceHistory.$inferInsert;
