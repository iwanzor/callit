"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Ban,
  AlertTriangle,
  Loader2,
  DollarSign,
  Users,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Market {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  category: string | null;
  status: "draft" | "open" | "closed" | "resolved" | "cancelled";
  resolution: "yes" | "no" | null;
  yesPrice: number;
  noPrice: number;
  totalVolume: number;
  totalYesShares: number;
  totalNoShares: number;
  closeAt: string | null;
  createdAt: string;
}

interface Position {
  userId: string;
  userEmail: string;
  yesShares: number;
  noShares: number;
}

export default function ResolveMarketPage() {
  const params = useParams();
  const router = useRouter();
  const marketId = params.id as string;

  const [market, setMarket] = useState<Market | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState(false);
  const [resolutionSource, setResolutionSource] = useState("");
  const [confirmResolution, setConfirmResolution] = useState<"yes" | "no" | "void" | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch market details
        const marketRes = await fetch(`/api/markets/${marketId}`);
        if (marketRes.ok) {
          const data = await marketRes.json();
          setMarket(data.market);
        }

        // Fetch positions (admin endpoint)
        const posRes = await fetch(`/api/admin/markets/${marketId}/positions`);
        if (posRes.ok) {
          const data = await posRes.json();
          setPositions(data.positions || []);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [marketId]);

  const handleResolve = async (resolution: "yes" | "no") => {
    setResolving(true);

    try {
      const res = await fetch(`/api/markets/${marketId}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resolution,
          resolutionSource,
        }),
      });

      if (res.ok) {
        router.push("/admin/markets");
      } else {
        const data = await res.json();
        alert(data.error || "Failed to resolve market");
      }
    } catch (error) {
      alert("Failed to resolve market");
    } finally {
      setResolving(false);
      setConfirmResolution(null);
    }
  };

  const handleCancel = async () => {
    setResolving(true);

    try {
      const res = await fetch(`/api/admin/markets/${marketId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: resolutionSource }),
      });

      if (res.ok) {
        router.push("/admin/markets");
      } else {
        const data = await res.json();
        alert(data.error || "Failed to cancel market");
      }
    } catch (error) {
      alert("Failed to cancel market");
    } finally {
      setResolving(false);
      setConfirmResolution(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!market) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="h-12 w-12 text-gray-600 mx-auto mb-3" />
        <p className="text-gray-400">Market not found</p>
        <Link
          href="/admin/markets"
          className="inline-flex items-center gap-2 mt-4 text-emerald-400 hover:text-emerald-300"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Markets
        </Link>
      </div>
    );
  }

  if (market.status === "resolved" || market.status === "cancelled") {
    return (
      <div className="max-w-3xl mx-auto">
        <Link
          href="/admin/markets"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Markets
        </Link>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center">
          <div className="mb-4">
            {market.status === "resolved" ? (
              market.resolution === "yes" ? (
                <CheckCircle className="h-16 w-16 text-emerald-500 mx-auto" />
              ) : (
                <XCircle className="h-16 w-16 text-red-500 mx-auto" />
              )
            ) : (
              <Ban className="h-16 w-16 text-yellow-500 mx-auto" />
            )}
          </div>
          <h2 className="text-xl font-bold text-white mb-2">
            Market Already {market.status === "resolved" ? "Resolved" : "Cancelled"}
          </h2>
          {market.resolution && (
            <p className="text-gray-400">
              Resolution: <span className="text-white font-medium">{market.resolution.toUpperCase()}</span>
            </p>
          )}
        </div>
      </div>
    );
  }

  const yesHolders = positions.filter((p) => p.yesShares > 0);
  const noHolders = positions.filter((p) => p.noShares > 0);
  const totalYesPayout = market.totalYesShares;
  const totalNoPayout = market.totalNoShares;

  return (
    <div className="max-w-4xl mx-auto">
      <Link
        href="/admin/markets"
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Markets
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Resolve Market</h1>
        <p className="text-gray-400">
          Review the market details and select the outcome
        </p>
      </div>

      {/* Market Details */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">{market.title}</h2>
        {market.description && (
          <p className="text-gray-400 text-sm mb-4 whitespace-pre-wrap">
            {market.description}
          </p>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-500 uppercase mb-1">Category</p>
            <p className="text-sm text-white capitalize">{market.category}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase mb-1">Volume</p>
            <p className="text-sm text-white">
              ${market.totalVolume.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase mb-1">Yes Price</p>
            <p className="text-sm text-emerald-400">
              {(market.yesPrice * 100).toFixed(0)}¢
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase mb-1">No Price</p>
            <p className="text-sm text-red-400">
              {(market.noPrice * 100).toFixed(0)}¢
            </p>
          </div>
        </div>
      </div>

      {/* Payout Preview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-900 border border-emerald-500/30 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <CheckCircle className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">If YES Wins</h3>
              <p className="text-xs text-gray-500">Preview of payouts</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">Winners</span>
              <span className="text-white">{yesHolders.length} users</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Total Shares</span>
              <span className="text-white">{market.totalYesShares.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t border-gray-800 pt-2">
              <span className="text-gray-400">Total Payout</span>
              <span className="text-emerald-400 font-semibold">
                ${totalYesPayout.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 border border-red-500/30 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-red-500/10">
              <XCircle className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">If NO Wins</h3>
              <p className="text-xs text-gray-500">Preview of payouts</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">Winners</span>
              <span className="text-white">{noHolders.length} users</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Total Shares</span>
              <span className="text-white">{market.totalNoShares.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t border-gray-800 pt-2">
              <span className="text-gray-400">Total Payout</span>
              <span className="text-red-400 font-semibold">
                ${totalNoPayout.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Resolution Source */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
        <label className="block text-sm font-medium text-gray-400 mb-2">
          Resolution Source (optional)
        </label>
        <textarea
          value={resolutionSource}
          onChange={(e) => setResolutionSource(e.target.value)}
          placeholder="Link or explanation for the resolution decision..."
          rows={2}
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
        />
      </div>

      {/* Resolution Actions */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Resolution Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            onClick={() => setConfirmResolution("yes")}
            disabled={resolving}
            className="flex flex-col items-center gap-2 p-4 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-xl transition-colors"
          >
            <CheckCircle className="h-8 w-8 text-emerald-400" />
            <span className="text-emerald-400 font-medium">YES Wins</span>
          </button>
          <button
            onClick={() => setConfirmResolution("no")}
            disabled={resolving}
            className="flex flex-col items-center gap-2 p-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-xl transition-colors"
          >
            <XCircle className="h-8 w-8 text-red-400" />
            <span className="text-red-400 font-medium">NO Wins</span>
          </button>
          <button
            onClick={() => setConfirmResolution("void")}
            disabled={resolving}
            className="flex flex-col items-center gap-2 p-4 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 rounded-xl transition-colors"
          >
            <Ban className="h-8 w-8 text-yellow-400" />
            <span className="text-yellow-400 font-medium">Void / Cancel</span>
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmResolution && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div
                className={cn(
                  "p-2 rounded-lg",
                  confirmResolution === "yes"
                    ? "bg-emerald-500/10"
                    : confirmResolution === "no"
                    ? "bg-red-500/10"
                    : "bg-yellow-500/10"
                )}
              >
                <AlertTriangle
                  className={cn(
                    "h-5 w-5",
                    confirmResolution === "yes"
                      ? "text-emerald-400"
                      : confirmResolution === "no"
                      ? "text-red-400"
                      : "text-yellow-400"
                  )}
                />
              </div>
              <h3 className="text-lg font-semibold text-white">
                Confirm Resolution
              </h3>
            </div>
            <p className="text-gray-400 mb-6">
              {confirmResolution === "void"
                ? "Are you sure you want to void/cancel this market? All positions will be refunded."
                : `Are you sure you want to resolve this market as ${confirmResolution.toUpperCase()}? This action cannot be undone.`}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmResolution(null)}
                disabled={resolving}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  confirmResolution === "void"
                    ? handleCancel()
                    : handleResolve(confirmResolution)
                }
                disabled={resolving}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors",
                  confirmResolution === "yes"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : confirmResolution === "no"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-yellow-600 hover:bg-yellow-700",
                  "text-white"
                )}
              >
                {resolving && <Loader2 className="h-4 w-4 animate-spin" />}
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
