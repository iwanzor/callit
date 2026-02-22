"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface OrderBookLevel {
  price: number;
  quantity: number;
  orders: number;
}

interface OrderBook {
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  summary: {
    bestBid: number | null;
    bestAsk: number | null;
    spread: number | null;
    bidDepth: number;
    askDepth: number;
  };
}

interface OrderFormProps {
  marketId: string;
  marketTitle: string;
  currentYesPrice: number;
  userBalance?: number;
  onOrderPlaced?: () => void;
}

export function OrderForm({
  marketId,
  marketTitle,
  currentYesPrice,
  userBalance = 0,
  onOrderPlaced,
}: OrderFormProps) {
  // Form state
  const [side, setSide] = useState<"yes" | "no">("yes");
  const [type, setType] = useState<"limit" | "market">("limit");
  const [price, setPrice] = useState<string>(currentYesPrice.toFixed(2));
  const [quantity, setQuantity] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Order book state
  const [orderBook, setOrderBook] = useState<OrderBook | null>(null);
  const [isLoadingOrderBook, setIsLoadingOrderBook] = useState(false);

  // Fetch order book
  const fetchOrderBook = useCallback(async () => {
    setIsLoadingOrderBook(true);
    try {
      const res = await fetch(`/api/markets/${marketId}/orderbook`);
      if (res.ok) {
        const data = await res.json();
        setOrderBook(data);
      }
    } catch (err) {
      console.error("Failed to fetch order book:", err);
    } finally {
      setIsLoadingOrderBook(false);
    }
  }, [marketId]);

  // Load order book on mount and refresh periodically
  useEffect(() => {
    fetchOrderBook();
    const interval = setInterval(fetchOrderBook, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, [fetchOrderBook]);

  // Update price when side changes (invert for NO side)
  useEffect(() => {
    if (type === "limit") {
      const yesPrice = parseFloat(price) || currentYesPrice;
      // When switching sides, keep the same "effective" price
      // setPrice(side === "yes" ? yesPrice.toFixed(2) : (1 - yesPrice).toFixed(2));
    }
  }, [side]);

  // Calculate potential profit/cost
  const calculatePotentials = () => {
    const priceNum = parseFloat(price) || 0;
    const quantityNum = parseFloat(quantity) || 0;

    if (quantityNum <= 0) {
      return { cost: 0, potentialProfit: 0, maxReturn: 0 };
    }

    // Cost = price × quantity
    const cost = priceNum * quantityNum;

    // If you win, you get $1 per share
    // Potential profit = (1 - price) × quantity
    const potentialProfit = (1 - priceNum) * quantityNum;

    // Max return percentage
    const maxReturn = priceNum > 0 ? ((1 - priceNum) / priceNum) * 100 : 0;

    return { cost, potentialProfit, maxReturn };
  };

  const { cost, potentialProfit, maxReturn } = calculatePotentials();

  // Submit order
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      const priceNum = type === "limit" ? parseFloat(price) : undefined;
      const quantityNum = parseFloat(quantity);

      if (!quantityNum || quantityNum <= 0) {
        throw new Error("Please enter a valid quantity");
      }

      if (type === "limit" && (!priceNum || priceNum < 0.01 || priceNum > 0.99)) {
        throw new Error("Price must be between 0.01 and 0.99");
      }

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          marketId,
          side,
          type,
          price: priceNum,
          quantity: quantityNum,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to place order");
      }

      // Success
      const tradesExecuted = data.trades?.length || 0;
      if (tradesExecuted > 0) {
        setSuccess(
          `Order placed! ${tradesExecuted} trade(s) executed. Status: ${data.order.status}`
        );
      } else {
        setSuccess(`Order placed! Status: ${data.order.status}`);
      }

      // Reset form
      setQuantity("");

      // Refresh order book
      fetchOrderBook();

      // Callback
      onOrderPlaced?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to place order");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Order Book */}
      <div className="rounded-lg border bg-card p-4">
        <h3 className="mb-4 text-lg font-semibold">Order Book</h3>

        {isLoadingOrderBook && !orderBook ? (
          <div className="flex h-64 items-center justify-center text-muted-foreground">
            Loading...
          </div>
        ) : orderBook ? (
          <div className="space-y-4">
            {/* Asks (Sell orders) - sorted high to low */}
            <div>
              <div className="mb-2 grid grid-cols-3 text-xs font-medium text-muted-foreground">
                <span>Price</span>
                <span className="text-right">Quantity</span>
                <span className="text-right">Orders</span>
              </div>
              <div className="space-y-1">
                {orderBook.asks.length > 0 ? (
                  [...orderBook.asks]
                    .slice(0, 5)
                    .reverse()
                    .map((ask, i) => (
                      <div
                        key={`ask-${i}`}
                        className="grid grid-cols-3 text-sm text-red-500"
                        onClick={() => {
                          setPrice(ask.price.toFixed(2));
                          setSide("yes");
                        }}
                        style={{ cursor: "pointer" }}
                      >
                        <span>{ask.price.toFixed(2)}</span>
                        <span className="text-right">{ask.quantity.toFixed(2)}</span>
                        <span className="text-right text-muted-foreground">
                          {ask.orders}
                        </span>
                      </div>
                    ))
                ) : (
                  <div className="text-center text-sm text-muted-foreground">
                    No asks
                  </div>
                )}
              </div>
            </div>

            {/* Spread indicator */}
            <div className="border-y py-2 text-center">
              <span className="text-sm font-medium">
                Spread:{" "}
                {orderBook.summary.spread !== null
                  ? `${(orderBook.summary.spread * 100).toFixed(1)}%`
                  : "N/A"}
              </span>
              <span className="mx-2 text-muted-foreground">|</span>
              <span className="text-sm text-muted-foreground">
                Last: {currentYesPrice.toFixed(2)}
              </span>
            </div>

            {/* Bids (Buy orders) - sorted high to low */}
            <div>
              <div className="space-y-1">
                {orderBook.bids.length > 0 ? (
                  orderBook.bids.slice(0, 5).map((bid, i) => (
                    <div
                      key={`bid-${i}`}
                      className="grid grid-cols-3 text-sm text-green-500"
                      onClick={() => {
                        setPrice(bid.price.toFixed(2));
                        setSide("yes");
                      }}
                      style={{ cursor: "pointer" }}
                    >
                      <span>{bid.price.toFixed(2)}</span>
                      <span className="text-right">{bid.quantity.toFixed(2)}</span>
                      <span className="text-right text-muted-foreground">
                        {bid.orders}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-sm text-muted-foreground">
                    No bids
                  </div>
                )}
              </div>
            </div>

            {/* Depth summary */}
            <div className="mt-4 flex justify-between text-xs text-muted-foreground">
              <span>Bid depth: {orderBook.summary.bidDepth.toFixed(2)}</span>
              <span>Ask depth: {orderBook.summary.askDepth.toFixed(2)}</span>
            </div>
          </div>
        ) : (
          <div className="flex h-64 items-center justify-center text-muted-foreground">
            Failed to load order book
          </div>
        )}
      </div>

      {/* Order Form */}
      <div className="rounded-lg border bg-card p-4">
        <h3 className="mb-4 text-lg font-semibold">Place Order</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Side Toggle */}
          <div>
            <Label className="mb-2 block">Outcome</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={side === "yes" ? "default" : "outline"}
                className={cn(
                  side === "yes" && "bg-green-600 hover:bg-green-700"
                )}
                onClick={() => setSide("yes")}
              >
                YES
              </Button>
              <Button
                type="button"
                variant={side === "no" ? "default" : "outline"}
                className={cn(side === "no" && "bg-red-600 hover:bg-red-700")}
                onClick={() => setSide("no")}
              >
                NO
              </Button>
            </div>
          </div>

          {/* Order Type */}
          <div>
            <Label className="mb-2 block">Order Type</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={type === "limit" ? "default" : "outline"}
                size="sm"
                onClick={() => setType("limit")}
              >
                Limit
              </Button>
              <Button
                type="button"
                variant={type === "market" ? "default" : "outline"}
                size="sm"
                onClick={() => setType("market")}
              >
                Market
              </Button>
            </div>
          </div>

          {/* Price Input (only for limit orders) */}
          {type === "limit" && (
            <div>
              <Label htmlFor="price" className="mb-2 block">
                Price (0.01 - 0.99)
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max="0.99"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="pl-7"
                  placeholder="0.50"
                />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {side === "yes"
                  ? `You think there's a ${(parseFloat(price) * 100 || 0).toFixed(0)}%+ chance of YES`
                  : `You think there's a ${(parseFloat(price) * 100 || 0).toFixed(0)}%+ chance of NO`}
              </p>
            </div>
          )}

          {/* Quantity Input */}
          <div>
            <Label htmlFor="quantity" className="mb-2 block">
              Shares
            </Label>
            <Input
              id="quantity"
              type="number"
              step="1"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="10"
            />
          </div>

          {/* Cost/Profit Summary */}
          {parseFloat(quantity) > 0 && (
            <div className="rounded-lg bg-muted/50 p-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Cost</span>
                <span className="font-medium">${cost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Potential profit</span>
                <span className="font-medium text-green-600">
                  +${potentialProfit.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Max return</span>
                <span className="font-medium text-green-600">
                  +{maxReturn.toFixed(0)}%
                </span>
              </div>
              {userBalance > 0 && cost > userBalance && (
                <p className="text-xs text-destructive">
                  Insufficient balance. You have ${userBalance.toFixed(2)}
                </p>
              )}
            </div>
          )}

          {/* Error/Success Messages */}
          {error && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-lg bg-green-500/10 p-3 text-sm text-green-600">
              {success}
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            className={cn(
              "w-full",
              side === "yes"
                ? "bg-green-600 hover:bg-green-700"
                : "bg-red-600 hover:bg-red-700"
            )}
            disabled={isSubmitting || !quantity}
          >
            {isSubmitting
              ? "Placing Order..."
              : `Buy ${side.toUpperCase()} @ ${type === "market" ? "Market" : `$${price}`}`}
          </Button>
        </form>

        {/* Balance info */}
        {userBalance > 0 && (
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Available balance: ${userBalance.toFixed(2)}
          </p>
        )}
      </div>
    </div>
  );
}
