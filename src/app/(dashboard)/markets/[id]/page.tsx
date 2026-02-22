"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Clock,
  TrendingUp,
  ExternalLink,
  Loader2,
  BarChart3,
  BookOpen,
} from "lucide-react";

interface Market {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  category: string | null;
  status: string;
  resolution: string | null;
  yesPrice: number;
  noPrice: number;
  totalVolume: number;
  totalYesShares: number;
  totalNoShares: number;
  closeAt: string | null;
  resolveAt: string | null;
  resolutionSource: string | null;
  createdAt: string;
}

interface OrderBookEntry {
  price: number;
  quantity: number;
}

interface OrderBook {
  yes: OrderBookEntry[];
  no: OrderBookEntry[];
}

interface PricePoint {
  yesPrice: number;
  volume: number;
  timestamp: string;
}

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
  const [market, setMarket] = useState<Market | null>(null);
  const [orderBook, setOrderBook] = useState<OrderBook>({ yes: [], no: [] });
  const [priceHistory, setPriceHistory] = useState<PricePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [tradeTab, setTradeTab] = useState<"yes" | "no">("yes");
  const [shares, setShares] = useState("");

  useEffect(() => {
    async function fetchMarket() {
      try {
        const res = await fetch(`/api/markets/${id}`);
        const data = await res.json();
        
        if (data.market) {
          setMarket(data.market);
          setOrderBook(data.orderBook || { yes: [], no: [] });
          setPriceHistory(data.priceHistory || []);
        }
      } catch (error) {
        console.error("Failed to fetch market:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchMarket();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  if (!market) {
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
  const estimatedCost = shares ? parseFloat(shares) * currentPrice : 0;
  const potentialReturn = shares ? parseFloat(shares) - estimatedCost : 0;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Back button */}
      <Link
        href="/markets"
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Markets
      </Link>

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

          {/* Price chart placeholder */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-gray-400" />
              Price History
            </h2>
            <div className="h-64 flex items-center justify-center border border-gray-800 rounded-lg bg-gray-950">
              {priceHistory.length > 0 ? (
                <div className="w-full h-full p-4">
                  {/* Simple price visualization */}
                  <div className="flex items-end justify-between h-full gap-1">
                    {priceHistory.slice(-50).map((point, i) => (
                      <div
                        key={i}
                        className="flex-1 bg-emerald-500/50 rounded-t min-w-[2px]"
                        style={{ height: `${point.yesPrice * 100}%` }}
                        title={`${(point.yesPrice * 100).toFixed(1)}¢`}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">No price history yet</p>
              )}
            </div>
          </div>

          {/* Order book */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Order Book</h2>
            <div className="grid grid-cols-2 gap-6">
              {/* YES orders */}
              <div>
                <h3 className="text-sm font-medium text-emerald-400 mb-3">YES Orders</h3>
                {orderBook.yes.length > 0 ? (
                  <div className="space-y-1">
                    {orderBook.yes.slice(0, 8).map((order, i) => (
                      <div
                        key={i}
                        className="flex justify-between text-sm py-1.5 px-2 rounded bg-emerald-500/5"
                      >
                        <span className="text-emerald-400">{(order.price * 100).toFixed(0)}¢</span>
                        <span className="text-gray-400">{order.quantity.toFixed(0)} shares</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No open orders</p>
                )}
              </div>
              {/* NO orders */}
              <div>
                <h3 className="text-sm font-medium text-red-400 mb-3">NO Orders</h3>
                {orderBook.no.length > 0 ? (
                  <div className="space-y-1">
                    {orderBook.no.slice(0, 8).map((order, i) => (
                      <div
                        key={i}
                        className="flex justify-between text-sm py-1.5 px-2 rounded bg-red-500/5"
                      >
                        <span className="text-red-400">{(order.price * 100).toFixed(0)}¢</span>
                        <span className="text-gray-400">{order.quantity.toFixed(0)} shares</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No open orders</p>
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
              <>
                {/* YES/NO tabs */}
                <div className="flex bg-gray-800 rounded-lg p-1 mb-4">
                  <button
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

                {/* Price display */}
                <div className="mb-4 p-3 bg-gray-800/50 rounded-lg">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">Current Price</span>
                    <span
                      className={cn(
                        "font-semibold",
                        tradeTab === "yes" ? "text-emerald-400" : "text-red-400"
                      )}
                    >
                      {(currentPrice * 100).toFixed(1)}¢
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Potential Payout</span>
                    <span className="text-white font-semibold">$1.00 / share</span>
                  </div>
                </div>

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
                      <span className="text-gray-400">Estimated Cost</span>
                      <span className="text-white">${estimatedCost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Potential Return</span>
                      <span className="text-emerald-400">+${potentialReturn.toFixed(2)}</span>
                    </div>
                  </div>
                )}

                {/* Trade button */}
                <button
                  disabled={!shares || parseFloat(shares) <= 0}
                  className={cn(
                    "w-full py-3 rounded-lg font-semibold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
                    tradeTab === "yes"
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-red-600 hover:bg-red-700"
                  )}
                >
                  Buy {tradeTab.toUpperCase()} Shares
                </button>

                <p className="text-xs text-gray-500 text-center mt-3">
                  Trading not yet implemented
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
