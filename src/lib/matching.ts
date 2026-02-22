import { db, orders, trades, positions, transactions, users, markets, priceHistory } from "./db";
import { eq, and, sql, asc, desc, or, ne } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

/**
 * Record a price point to the price_history table
 * Called after trades are executed to track price changes over time
 */
export async function recordPriceHistory(
  marketId: string,
  yesPrice: number,
  volume: number
): Promise<void> {
  try {
    await db.insert(priceHistory).values({
      marketId,
      yesPrice: yesPrice.toFixed(2),
      volume: volume.toFixed(2),
      timestamp: new Date(),
    });
  } catch (error) {
    // Log but don't throw - price history recording shouldn't break trading
    console.error("Failed to record price history:", error);
  }
}

export interface MatchResult {
  orderId: string;
  trades: TradeResult[];
  remainingQuantity: number;
  status: "open" | "filled" | "partial";
}

export interface TradeResult {
  tradeId: string;
  matchedOrderId: string;
  price: number;
  quantity: number;
  buyerId: string;
  sellerId: string;
}

/**
 * Prediction Market Matching Engine
 * 
 * Key concepts:
 * - YES price + NO price = 1.00 (always)
 * - Buying YES at 0.60 is equivalent to selling NO at 0.40
 * - Orders match when: buy_price >= sell_price
 * - Price-time priority (FIFO at each price level)
 */

export async function matchOrder(
  userId: string,
  marketId: string,
  side: "yes" | "no",
  type: "limit" | "market",
  price: number,
  quantity: number
): Promise<MatchResult> {
  // Validate inputs
  if (quantity <= 0) {
    throw new Error("Quantity must be positive");
  }
  if (type === "limit" && (price < 0.01 || price > 0.99)) {
    throw new Error("Price must be between 0.01 and 0.99");
  }

  // For market orders, use extreme prices to match any available
  const effectivePrice = type === "market" 
    ? (side === "yes" ? 0.99 : 0.01) // Most aggressive price
    : price;

  const orderId = uuidv4();
  let remainingQty = quantity;
  const executedTrades: TradeResult[] = [];

  await db.transaction(async (tx) => {
    // Verify market is open
    const [market] = await tx
      .select()
      .from(markets)
      .where(eq(markets.id, marketId))
      .limit(1);

    if (!market || market.status !== "open") {
      throw new Error("Market is not open for trading");
    }

    // Verify user balance
    const [user] = await tx
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new Error("User not found");
    }

    const maxCost = effectivePrice * quantity;
    const availableBalance = parseFloat(user.balance) - parseFloat(user.frozenBalance);
    
    if (availableBalance < maxCost) {
      throw new Error("Insufficient balance");
    }

    // Get matching orders
    // For buying YES at price P: match with selling YES at <=P OR buying NO at <= (1-P)
    // For buying NO at price P: match with selling NO at <=P OR buying YES at <= (1-P)
    const matchingOrders = await getMatchingOrders(tx, marketId, side, effectivePrice, userId);

    // Execute matches
    for (const matchOrder of matchingOrders) {
      if (remainingQty <= 0) break;

      const matchQty = Math.min(remainingQty, parseFloat(matchOrder.remainingQty));
      const tradePrice = parseFloat(matchOrder.price); // Maker's price

      const tradeId = uuidv4();
      
      // Determine buyer/seller based on who's buying shares
      const isBuyer = true; // The incoming order is always the "buyer" of the side they chose
      const buyerId = userId;
      const sellerId = matchOrder.userId;

      // Create trade record
      await tx.insert(trades).values({
        id: tradeId,
        marketId,
        buyOrderId: orderId,
        sellOrderId: matchOrder.id,
        buyerId,
        sellerId,
        side,
        price: tradePrice.toFixed(2),
        quantity: matchQty.toFixed(2),
      });

      // Update matched order
      const newFilledQty = parseFloat(matchOrder.filledQuantity) + matchQty;
      const newRemainingQty = parseFloat(matchOrder.quantity) - newFilledQty;
      const matchStatus = newRemainingQty <= 0 ? "filled" : "partial";

      await tx
        .update(orders)
        .set({
          filledQuantity: newFilledQty.toFixed(2),
          remainingQty: newRemainingQty.toFixed(2),
          status: matchStatus,
        })
        .where(eq(orders.id, matchOrder.id));

      // Update positions for both parties
      await updatePosition(tx, buyerId, marketId, side, matchQty, tradePrice, "buy");
      await updatePosition(tx, sellerId, marketId, side, matchQty, tradePrice, "sell");

      // Update balances
      const tradeCost = tradePrice * matchQty;
      
      // Buyer pays
      await tx
        .update(users)
        .set({
          balance: sql`${users.balance} - ${tradeCost.toFixed(2)}`,
        })
        .where(eq(users.id, buyerId));

      // Seller receives (unfreeze and add)
      await tx
        .update(users)
        .set({
          balance: sql`${users.balance} + ${tradeCost.toFixed(2)}`,
          frozenBalance: sql`${users.frozenBalance} - ${tradeCost.toFixed(2)}`,
        })
        .where(eq(users.id, sellerId));

      // Create transaction records
      const buyerBalanceResult = await tx
        .select({ balance: users.balance })
        .from(users)
        .where(eq(users.id, buyerId))
        .limit(1);

      await tx.insert(transactions).values({
        id: uuidv4(),
        userId: buyerId,
        type: "trade_buy",
        amount: (-tradeCost).toFixed(2),
        balanceAfter: buyerBalanceResult[0].balance,
        referenceType: "trade",
        referenceId: tradeId,
      });

      const sellerBalanceResult = await tx
        .select({ balance: users.balance })
        .from(users)
        .where(eq(users.id, sellerId))
        .limit(1);

      await tx.insert(transactions).values({
        id: uuidv4(),
        userId: sellerId,
        type: "trade_sell",
        amount: tradeCost.toFixed(2),
        balanceAfter: sellerBalanceResult[0].balance,
        referenceType: "trade",
        referenceId: tradeId,
      });

      executedTrades.push({
        tradeId,
        matchedOrderId: matchOrder.id,
        price: tradePrice,
        quantity: matchQty,
        buyerId,
        sellerId,
      });

      remainingQty -= matchQty;
    }

    // Create the order record
    const filledQty = quantity - remainingQty;
    const orderStatus: "open" | "filled" | "partial" = 
      remainingQty <= 0 ? "filled" : 
      filledQty > 0 ? "partial" : "open";

    // For limit orders with remaining quantity, freeze balance
    if (type === "limit" && remainingQty > 0) {
      const freezeAmount = effectivePrice * remainingQty;
      await tx
        .update(users)
        .set({
          frozenBalance: sql`${users.frozenBalance} + ${freezeAmount.toFixed(2)}`,
        })
        .where(eq(users.id, userId));
    }

    // Market orders that don't fully fill should be cancelled
    if (type === "market" && remainingQty > 0) {
      // Market order couldn't be fully filled - this becomes a cancelled order
      await tx.insert(orders).values({
        id: orderId,
        userId,
        marketId,
        side,
        type,
        price: effectivePrice.toFixed(2),
        quantity: quantity.toFixed(2),
        filledQuantity: filledQty.toFixed(2),
        remainingQty: "0.00",
        status: filledQty > 0 ? "partial" : "cancelled",
      });
    } else {
      await tx.insert(orders).values({
        id: orderId,
        userId,
        marketId,
        side,
        type,
        price: effectivePrice.toFixed(2),
        quantity: quantity.toFixed(2),
        filledQuantity: filledQty.toFixed(2),
        remainingQty: remainingQty.toFixed(2),
        status: orderStatus,
      });
    }

    // Update market price and volume
    if (executedTrades.length > 0) {
      const lastTradePrice = executedTrades[executedTrades.length - 1].price;
      const totalVolume = executedTrades.reduce((sum, t) => sum + t.price * t.quantity, 0);
      const newYesPrice = side === "yes" ? lastTradePrice : (1 - lastTradePrice);

      await tx
        .update(markets)
        .set({
          yesPrice: newYesPrice.toFixed(2),
          totalVolume: sql`${markets.totalVolume} + ${totalVolume.toFixed(2)}`,
        })
        .where(eq(markets.id, marketId));

      // Record price history for charting
      await tx.insert(priceHistory).values({
        marketId,
        yesPrice: newYesPrice.toFixed(2),
        volume: totalVolume.toFixed(2),
        timestamp: new Date(),
      });
    }
  });

  const finalStatus: "open" | "filled" | "partial" = 
    remainingQty <= 0 ? "filled" : 
    executedTrades.length > 0 ? "partial" : "open";

  return {
    orderId,
    trades: executedTrades,
    remainingQuantity: type === "market" ? 0 : remainingQty,
    status: finalStatus,
  };
}

async function getMatchingOrders(
  tx: any,
  marketId: string,
  side: "yes" | "no",
  price: number,
  excludeUserId: string
) {
  // For buying YES at price P:
  // - Match with sell YES orders (other people's YES limit orders) at price <= P
  // Since we're storing buy orders, we need to find:
  // - Opposite side orders where their price complements ours
  // 
  // In a prediction market:
  // - When you buy YES, you need someone selling YES (they have YES shares to sell)
  // - OR someone buying NO at the complementary price (1 - P)
  
  // For simplicity, we match:
  // - Same side orders that are on the opposite "direction" (selling vs buying)
  // But our schema doesn't distinguish buy/sell direction, only side (yes/no)
  
  // Let's interpret this as:
  // - All orders are "buy" orders for their respective side
  // - Buying YES at 0.60 matches with buying NO at 0.40 (because 0.60 + 0.40 = 1.00)
  
  const complementaryPrice = (1 - price).toFixed(2);
  const oppositeSide = side === "yes" ? "no" : "yes";
  
  // Match with opposite side orders where their price <= complementary price
  // Sorted by price (best first) then time (oldest first)
  const matchingOrders = await tx
    .select()
    .from(orders)
    .where(
      and(
        eq(orders.marketId, marketId),
        eq(orders.side, oppositeSide),
        or(eq(orders.status, "open"), eq(orders.status, "partial")),
        ne(orders.userId, excludeUserId),
        sql`${orders.price} <= ${complementaryPrice}`
      )
    )
    .orderBy(asc(orders.price), asc(orders.createdAt));

  return matchingOrders;
}

async function updatePosition(
  tx: any,
  userId: string,
  marketId: string,
  side: "yes" | "no",
  quantity: number,
  price: number,
  direction: "buy" | "sell"
) {
  // Get or create position
  const [existingPosition] = await tx
    .select()
    .from(positions)
    .where(and(eq(positions.userId, userId), eq(positions.marketId, marketId)))
    .limit(1);

  if (!existingPosition) {
    // Create new position
    const newPosition: any = {
      id: uuidv4(),
      userId,
      marketId,
      yesShares: "0.00",
      noShares: "0.00",
    };

    if (direction === "buy") {
      if (side === "yes") {
        newPosition.yesShares = quantity.toFixed(2);
        newPosition.avgYesPrice = price.toFixed(2);
      } else {
        newPosition.noShares = quantity.toFixed(2);
        newPosition.avgNoPrice = price.toFixed(2);
      }
    }
    // Selling from zero shares shouldn't happen, but handle gracefully

    await tx.insert(positions).values(newPosition);
  } else {
    // Update existing position
    const updates: any = {};

    if (side === "yes") {
      const currentShares = parseFloat(existingPosition.yesShares);
      const currentAvg = existingPosition.avgYesPrice ? parseFloat(existingPosition.avgYesPrice) : 0;

      if (direction === "buy") {
        const newShares = currentShares + quantity;
        const newAvg = (currentAvg * currentShares + price * quantity) / newShares;
        updates.yesShares = newShares.toFixed(2);
        updates.avgYesPrice = newAvg.toFixed(2);
      } else {
        const newShares = Math.max(0, currentShares - quantity);
        updates.yesShares = newShares.toFixed(2);
        // Calculate realized P&L
        if (currentAvg > 0) {
          const pnl = (price - currentAvg) * quantity;
          updates.realizedPnl = sql`${positions.realizedPnl} + ${pnl.toFixed(2)}`;
        }
      }
    } else {
      const currentShares = parseFloat(existingPosition.noShares);
      const currentAvg = existingPosition.avgNoPrice ? parseFloat(existingPosition.avgNoPrice) : 0;

      if (direction === "buy") {
        const newShares = currentShares + quantity;
        const newAvg = (currentAvg * currentShares + price * quantity) / newShares;
        updates.noShares = newShares.toFixed(2);
        updates.avgNoPrice = newAvg.toFixed(2);
      } else {
        const newShares = Math.max(0, currentShares - quantity);
        updates.noShares = newShares.toFixed(2);
        // Calculate realized P&L
        if (currentAvg > 0) {
          const pnl = (price - currentAvg) * quantity;
          updates.realizedPnl = sql`${positions.realizedPnl} + ${pnl.toFixed(2)}`;
        }
      }
    }

    await tx
      .update(positions)
      .set(updates)
      .where(eq(positions.id, existingPosition.id));
  }
}

export async function cancelOrder(orderId: string, userId: string): Promise<boolean> {
  return await db.transaction(async (tx) => {
    // Get the order
    const [order] = await tx
      .select()
      .from(orders)
      .where(and(eq(orders.id, orderId), eq(orders.userId, userId)))
      .limit(1);

    if (!order) {
      throw new Error("Order not found");
    }

    if (order.status !== "open" && order.status !== "partial") {
      throw new Error("Order cannot be cancelled");
    }

    // Unfreeze the remaining balance
    const remainingCost = parseFloat(order.price) * parseFloat(order.remainingQty);

    await tx
      .update(users)
      .set({
        frozenBalance: sql`${users.frozenBalance} - ${remainingCost.toFixed(2)}`,
      })
      .where(eq(users.id, userId));

    // Cancel the order
    await tx
      .update(orders)
      .set({
        status: "cancelled",
        remainingQty: "0.00",
      })
      .where(eq(orders.id, orderId));

    return true;
  });
}

export async function getOrderBook(marketId: string) {
  // Get all open orders grouped by price level
  const openOrders = await db
    .select({
      side: orders.side,
      price: orders.price,
      totalQuantity: sql<string>`SUM(${orders.remainingQty})`,
      orderCount: sql<number>`COUNT(*)`,
    })
    .from(orders)
    .where(
      and(
        eq(orders.marketId, marketId),
        or(eq(orders.status, "open"), eq(orders.status, "partial"))
      )
    )
    .groupBy(orders.side, orders.price)
    .orderBy(desc(orders.price));

  // YES orders are bids (people wanting to buy YES)
  // NO orders converted to asks (buying NO at X = selling YES at 1-X)
  const bids: { price: number; quantity: number; orders: number }[] = [];
  const asks: { price: number; quantity: number; orders: number }[] = [];

  for (const row of openOrders) {
    const price = parseFloat(row.price);
    const quantity = parseFloat(row.totalQuantity);
    const orderCount = row.orderCount;

    if (row.side === "yes") {
      bids.push({ price, quantity, orders: orderCount });
    } else {
      // NO order at price P = ask (sell YES) at price 1-P
      asks.push({ price: 1 - price, quantity, orders: orderCount });
    }
  }

  // Sort bids descending (highest first), asks ascending (lowest first)
  bids.sort((a, b) => b.price - a.price);
  asks.sort((a, b) => a.price - b.price);

  return { bids, asks };
}
