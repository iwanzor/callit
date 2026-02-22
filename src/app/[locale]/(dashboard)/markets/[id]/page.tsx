"use client";

import { use, useState, useCallback } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Clock,
  TrendingUp,
  ExternalLink,
  Loader2,
  BookOpen,
  RefreshCw,
} from "lucide-react";
import { PriceChart } from "@/components/charts/price-chart";
import { useMarketData, useOrderBook, useUserBalance } from "@/hooks/use-market-data";

const categoryColors: Record<string, string> = {
  sports: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  politics: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  crypto: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  economy: "bg-green-500/20 text-green-400 border-green-500/30",
  entertainment: "bg-pink-500/20 text-pink-400 border-pink-500/30",
  other: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MarketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  
  // Real-time data hooks
  const { market, isLoading: marketLoading, isError: marketError, refresh: refreshMarket } = useMarketData(id);
  const { bids, asks, summary, refresh: refreshOrderBook } = useOrderBook(id);
  const { availableBalance, refresh: refreshBalance } = useUserBalance();
  
  // Trade form state
  const [tradeTab, setTradeTab] = useState<"yes" | "no">("yes");
  const [orderType, setOrderType] = useState<"limit" | "market">("limit");
  const [shares, setShares] = useState("");
  const [price, setPrice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tradeError, setTradeError] = useState<string | null>(null);
  const [tradeSuccess, setTradeSuccess] = useState<string | null>(null);

  // Refresh all data
  const refreshAll = useCallback(() => {
    refreshMarket();
    refreshOrderBook();
    refreshBalance();
  }, [refreshMarket, refreshOrderBook, refreshBalance]);

  // Handle order submission
  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!market || !shares) return;

    setIsSubmitting(true);
    setTradeError(null);
    setTradeSuccess(null);

    try {
      const quantity = parseFloat(shares);
      const orderPrice = orderType === "limit" 
        ? parseFloat(price) || (tradeTab === "yes" ? market.yesPrice : market.noPrice)
        : undefined;

      if (quantity <= 0) {
        throw new Error("Please enter a valid quantity");
      }

      if (orderType === "limit" && orderPrice && (orderPrice < 0.01 || orderPrice > 0.99)) {
        throw new Error("Price must be between 0.01 and 0.99");
      }

      const token = localStorage.getItem("accessToken");
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          marketId: id,
          side: tradeTab,
          type: orderType,
          price: orderPrice,
          quantity,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to place order");

      const tradesExecuted = data.trades?.length || 0;
      setTradeSuccess(
        tradesExecuted > 0
          ? `Order placed! ${tradesExecuted} trade(s) executed.`
          : `Order placed! Status: ${data.order.status}`
      );

      setShares("");
      refreshAll();
    } catch (err) {
      setTradeError(err instanceof Error ? err.message : "Failed to place order");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (marketLoading && !market) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  // Error state
  if (marketError || !market) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-white mb-2">Market not found</h2>
        <p className="text-gray-400 mb-4">The market you're looking for doesn't exist.</p>
        <Link href="/markets" className="text-emerald-400 hover:underline">
          ← Back to markets
        </Link>
      </div>
    );
  }

  const categoryColor = categoryColors[market.category || "other"] || categoryColors.other;
  const currentPrice = tradeTab === "yes" ? market.yesPrice : market.noPrice;
  const effectivePrice = orderType === "limit" 
    ? (parseFloat(price) || currentPrice) 
    : currentPrice;
  const estimatedCost = shares ? parseFloat(shares) * effectivePrice : 0;
  const potentialReturn = shares ? parseFloat(shares) - estimatedCost : 0;

  // Best bid/ask for the selected side
  const bestBid = summary.bestBid;
  const bestAsk = summary.bestAsk;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Back button and refresh */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/markets"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Markets
        </Link>
        <button
          onClick={refreshAll}
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Market header */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="flex-1">
                <span
                  className={cn(
                    "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border mb-2",
                    categoryColor
                  )}
                >
                  {market.category || "other"}
                </span>
                <h1 className="text-2xl font-bold text-white mb-2">{market.title}</h1>
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-4 w-4" />
                    <span>${market.totalVolume.toLocaleString()} volume</span>
                  </div>
                  {market.closeAt && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>Closes {formatDate(market.closeAt)}</span>
                    </div>
                  )}
                </div>
              </div>
              {market.status === "resolved" && (
                <div
                  className={cn(
                    "px-4 py-2 rounded-lg font-bold text-lg",
                    market.resolution === "yes"
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-red-500/20 text-red-400"
                  )}
                >
                  {market.resolution?.toUpperCase()}
                </div>
              )}
            </div>

            {/* Large price display */}
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6 text-center">
                <p className="text-sm text-emerald-400 font-medium mb-2">YES</p>
                <p className="text-4xl font-bold text-emerald-400">
                  {(market.yesPrice * 100).toFixed(1)}¢
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  {market.totalYesShares.toLocaleString()} shares
                </p>
              </div>
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
                <p className="text-sm text-red-400 font-medium mb-2">NO</p>
                <p className="text-4xl font-bold text-red-400">
                  {(market.noPrice * 100).toFixed(1)}¢
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  {market.totalNoShares.toLocaleString()} shares
                </p>
              </div>
            </div>
          </div>

          {/* Price Chart */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <PriceChart 
              marketId={id} 
              currentPrice={market.yesPrice}
            />
          </div>

          {/* Description */}
          {market.description && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-gray-400" />
                Resolution Criteria
              </h2>
              <p className="text-gray-300 whitespace-pre-wrap">{market.description}</p>
              {market.resolutionSource && (
                <a
                  href={market.resolutionSource}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-emerald-400 hover:underline mt-3 text-sm"
                >
                  Resolution Source <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          )}

          {/* Order Book */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Order Book</h2>
              {summary.spread !== null && (
                <span className="text-sm text-gray-400">
                  Spread: {(summary.spread * 100).toFixed(1)}%
                </span>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              {/* Bids (YES buyers) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-emerald-400">Bids (YES)</h3>
                  <span className="text-xs text-gray-500">
                    Depth: {summary.bidDepth.toFixed(0)}
                  </span>
                </div>
                {bids.length > 0 ? (
                  <div className="space-y-1">
                    <div className="grid grid-cols-3 text-xs text-gray-500 mb-1 px-2">
                      <span>Price</span>
                      <span className="text-right">Qty</span>
                      <span className="text-right">Orders</span>
                    </div>
                    {bids.slice(0, 8).map((bid, i) => (
                      <div
                        key={i}
                        className={cn(
                          "grid grid-cols-3 text-sm py-1.5 px-2 rounded transition-colors cursor-pointer hover:bg-emerald-500/10",
                          i === 0 && "bg-emerald-500/5"
                        )}
                        onClick={() => {
                          setPrice(bid.price.toFixed(2));
                          setTradeTab("yes");
                        }}
                      >
                        <span className="text-emerald-400 font-medium">
                          {(bid.price * 100).toFixed(0)}¢
                        </span>
                        <span className="text-gray-400 text-right">
                          {bid.quantity.toFixed(0)}
                        </span>
                        <span className="text-gray-500 text-right">
                          {bid.orders}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm py-4 text-center">No bids</p>
                )}
              </div>

              {/* Asks (YES sellers / NO buyers) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-red-400">Asks (NO)</h3>
                  <span className="text-xs text-gray-500">
                    Depth: {summary.askDepth.toFixed(0)}
                  </span>
                </div>
                {asks.length > 0 ? (
                  <div className="space-y-1">
                    <div className="grid grid-cols-3 text-xs text-gray-500 mb-1 px-2">
                      <span>Price</span>
                      <span className="text-right">Qty</span>
                      <span className="text-right">Orders</span>
                    </div>
                    {asks.slice(0, 8).map((ask, i) => (
                      <div
                        key={i}
                        className={cn(
                          "grid grid-cols-3 text-sm py-1.5 px-2 rounded transition-colors cursor-pointer hover:bg-red-500/10",
                          i === 0 && "bg-red-500/5"
                        )}
                        onClick={() => {
                          setPrice(ask.price.toFixed(2));
                          setTradeTab("yes");
                        }}
                      >
                        <span className="text-red-400 font-medium">
                          {(ask.price * 100).toFixed(0)}¢
                        </span>
                        <span className="text-gray-400 text-right">
                          {ask.quantity.toFixed(0)}
                        </span>
                        <span className="text-gray-500 text-right">
                          {ask.orders}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm py-4 text-center">No asks</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Trade panel */}
        <div className="lg:col-span-1">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 sticky top-8">
            <h2 className="text-lg font-semibold text-white mb-4">Trade</h2>

            {market.status !== "open" ? (
              <div className="text-center py-8">
                <p className="text-gray-400">
                  {market.status === "resolved"
                    ? "This market has been resolved"
                    : "This market is not open for trading"}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitOrder}>
                {/* YES/NO tabs */}
                <div className="flex bg-gray-800 rounded-lg p-1 mb-4">
                  <button
                    type="button"
                    onClick={() => setTradeTab("yes")}
                    className={cn(
                      "flex-1 py-2 rounded-md text-sm font-medium transition-colors",
                      tradeTab === "yes"
                        ? "bg-emerald-500 text-white"
                        : "text-gray-400 hover:text-white"
                    )}
                  >
                    Buy YES
                  </button>
                  <button
                    type="button"
                    onClick={() => setTradeTab("no")}
                    className={cn(
                      "flex-1 py-2 rounded-md text-sm font-medium transition-colors",
                      tradeTab === "no"
                        ? "bg-red-500 text-white"
                        : "text-gray-400 hover:text-white"
                    )}
                  >
                    Buy NO
                  </button>
                </div>

                {/* Order type */}
                <div className="flex gap-2 mb-4">
                  <button
                    type="button"
                    onClick={() => setOrderType("limit")}
                    className={cn(
                      "flex-1 py-1.5 text-xs rounded-md transition-colors",
                      orderType === "limit"
                        ? "bg-gray-700 text-white"
                        : "bg-gray-800/50 text-gray-400 hover:text-white"
                    )}
                  >
                    Limit
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderType("market")}
                    className={cn(
                      "flex-1 py-1.5 text-xs rounded-md transition-colors",
                      orderType === "market"
                        ? "bg-gray-700 text-white"
                        : "bg-gray-800/50 text-gray-400 hover:text-white"
                    )}
                  >
                    Market
                  </button>
                </div>

                {/* Best bid/ask indicator */}
                <div className="mb-4 p-2 bg-gray-800/30 rounded-lg">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Best Bid</span>
                    <span className="text-emerald-400 font-medium">
                      {bestBid !== null ? `${(bestBid * 100).toFixed(0)}¢` : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs mt-1">
                    <span className="text-gray-400">Best Ask</span>
                    <span className="text-red-400 font-medium">
                      {bestAsk !== null ? `${(bestAsk * 100).toFixed(0)}¢` : "—"}
                    </span>
                  </div>
                </div>

                {/* Price input (limit orders) */}
                {orderType === "limit" && (
                  <div className="mb-4">
                    <label className="block text-sm text-gray-400 mb-2">
                      Price (¢)
                    </label>
                    <input
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder={`${(currentPrice * 100).toFixed(0)}`}
                      min="1"
                      max="99"
                      step="1"
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Range: 1¢ - 99¢
                    </p>
                  </div>
                )}

                {/* Shares input */}
                <div className="mb-4">
                  <label className="block text-sm text-gray-400 mb-2">Shares</label>
                  <input
                    type="number"
                    value={shares}
                    onChange={(e) => setShares(e.target.value)}
                    placeholder="Enter number of shares"
                    min="1"
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Quick amounts */}
                <div className="flex gap-2 mb-4">
                  {[10, 50, 100, 500].map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => setShares(amount.toString())}
                      className="flex-1 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 text-gray-400 rounded transition-colors"
                    >
                      {amount}
                    </button>
                  ))}
                </div>

                {/* Cost breakdown */}
                {shares && (
                  <div className="mb-4 p-3 bg-gray-800/50 rounded-lg space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">
                        {orderType === "limit" ? "Max Cost" : "Est. Cost"}
                      </span>
                      <span className="text-white">${estimatedCost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Potential Return</span>
                      <span className="text-emerald-400">+${potentialReturn.toFixed(2)}</span>
                    </div>
                    {estimatedCost > availableBalance && (
                      <p className="text-xs text-red-400">
                        Insufficient balance (${availableBalance.toFixed(2)} available)
                      </p>
                    )}
                  </div>
                )}

                {/* Error/Success messages */}
                {tradeError && (
                  <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
                    {tradeError}
                  </div>
                )}
                {tradeSuccess && (
                  <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-sm text-emerald-400">
                    {tradeSuccess}
                  </div>
                )}

                {/* Trade button */}
                <button
                  type="submit"
                  disabled={!shares || parseFloat(shares) <= 0 || isSubmitting}
                  className={cn(
                    "w-full py-3 rounded-lg font-semibold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
                    tradeTab === "yes"
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-red-600 hover:bg-red-700"
                  )}
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Placing Order...
                    </span>
                  ) : (
                    `Buy ${tradeTab.toUpperCase()} @ ${(currentPrice * 100).toFixed(0)}¢`
                  )}
                </button>

                {availableBalance > 0 && (
                  <p className="text-xs text-gray-500 text-center mt-3">
                    Available: ${availableBalance.toFixed(2)}
                  </p>
                )}
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
