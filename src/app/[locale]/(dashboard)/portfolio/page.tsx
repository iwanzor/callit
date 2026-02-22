"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Briefcase, TrendingUp, TrendingDown, Loader2, DollarSign, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface Position {
  id: string;
  marketId: string;
  market: {
    title: string;
    slug: string;
    status: string;
    resolution: string | null;
  };
  yesShares: number;
  noShares: number;
  avgYesPrice: number;
  avgNoPrice: number;
  currentYesPrice: number;
  currentNoPrice: number;
  yesValue: number;
  noValue: number;
  totalValue: number;
  totalCost: number;
  unrealizedPnl: number;
  realizedPnl: number;
  potentialPayout: {
    ifYes: number;
    ifNo: number;
  };
}

interface PortfolioSummary {
  totalValue: number;
  totalCost: number;
  totalUnrealizedPnl: number;
  totalRealizedPnl: number;
  positionCount: number;
}

export default function PortfolioPage() {
  const t = useTranslations("portfolio");
  const tLanding = useTranslations("landing");
  const locale = useLocale();

  const [positions, setPositions] = useState<Position[]>([]);
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getAuthHeader = (): Record<string, string> => {
    const token = localStorage.getItem("accessToken");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchPositions = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/positions", {
        headers: getAuthHeader(),
      });

      if (!res.ok) {
        if (res.status === 401) {
          setError(locale === "sr" ? "Morate biti prijavljeni" : "Please log in to view your portfolio");
          setLoading(false);
          return;
        }
        throw new Error("Failed to fetch positions");
      }

      const data = await res.json();
      setPositions(data.positions || []);
      setSummary(data.summary || null);
    } catch (err) {
      setError(locale === "sr" ? "Greška pri učitavanju pozicija" : "Failed to load positions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPositions();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">{t("title")}</h1>
          <p className="text-gray-400">{t("subtitle")}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
          <Briefcase className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 mb-6">{error}</p>
          <Link
            href="/login"
            className="inline-block px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors"
          >
            {locale === "sr" ? "Prijavi se" : "Log In"}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">{t("title")}</h1>
          <p className="text-gray-400">{t("subtitle")}</p>
        </div>
        <button
          onClick={fetchPositions}
          className="p-2 text-gray-400 hover:text-white transition-colors"
          title={locale === "sr" ? "Osveži" : "Refresh"}
        >
          <RefreshCw className="h-5 w-5" />
        </button>
      </div>

      {/* Summary Cards */}
      {summary && positions.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-sm text-gray-400 mb-1">{t("currentValue")}</p>
            <p className="text-2xl font-bold text-white">
              ${summary.totalValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-sm text-gray-400 mb-1">{t("totalInvested")}</p>
            <p className="text-2xl font-bold text-white">
              ${summary.totalCost.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-sm text-gray-400 mb-1">{t("profitLoss")}</p>
            <p className={cn(
              "text-2xl font-bold",
              summary.totalUnrealizedPnl >= 0 ? "text-emerald-400" : "text-red-400"
            )}>
              {summary.totalUnrealizedPnl >= 0 ? "+" : ""}
              ${summary.totalUnrealizedPnl.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-sm text-gray-400 mb-1">{locale === "sr" ? "Pozicija" : "Positions"}</p>
            <p className="text-2xl font-bold text-white">{summary.positionCount}</p>
          </div>
        </div>
      )}

      {positions.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
          <Briefcase className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">{t("noPositions")}</h2>
          <p className="text-gray-400 mb-6">{t("startTrading")}</p>
          <Link
            href="/markets"
            className="inline-block px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors"
          >
            {tLanding("exploreMarkets")}
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {positions.map((position) => {
            const hasYes = position.yesShares > 0;
            const hasNo = position.noShares > 0;
            
            return (
              <div
                key={position.id}
                className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <Link
                      href={`/markets/${position.marketId}`}
                      className="text-lg font-semibold text-white hover:text-emerald-400 transition-colors"
                    >
                      {position.market.title}
                    </Link>
                    <div className="flex items-center gap-3 mt-1">
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded",
                        position.market.status === "open" 
                          ? "bg-emerald-500/20 text-emerald-400"
                          : position.market.status === "resolved"
                          ? "bg-purple-500/20 text-purple-400"
                          : "bg-gray-500/20 text-gray-400"
                      )}>
                        {position.market.status === "open" 
                          ? (locale === "sr" ? "Aktivan" : "Open")
                          : position.market.status === "resolved"
                          ? (locale === "sr" ? "Razrešen" : "Resolved")
                          : position.market.status}
                      </span>
                      {position.market.resolution && (
                        <span className={cn(
                          "text-xs px-2 py-0.5 rounded",
                          position.market.resolution === "yes"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-red-500/20 text-red-400"
                        )}>
                          {position.market.resolution.toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-400">{t("currentValue")}</p>
                    <p className="text-xl font-bold text-white">
                      ${position.totalValue.toFixed(2)}
                    </p>
                    <p className={cn(
                      "text-sm",
                      position.unrealizedPnl >= 0 ? "text-emerald-400" : "text-red-400"
                    )}>
                      {position.unrealizedPnl >= 0 ? "+" : ""}
                      ${position.unrealizedPnl.toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-800">
                  {hasYes && (
                    <>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">YES {locale === "sr" ? "akcije" : "shares"}</p>
                        <p className="text-sm font-medium text-emerald-400">
                          {position.yesShares.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">{t("avgPrice")}</p>
                        <p className="text-sm font-medium text-white">
                          {(position.avgYesPrice * 100).toFixed(0)}¢
                        </p>
                      </div>
                    </>
                  )}
                  {hasNo && (
                    <>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">NO {locale === "sr" ? "akcije" : "shares"}</p>
                        <p className="text-sm font-medium text-red-400">
                          {position.noShares.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">{t("avgPrice")}</p>
                        <p className="text-sm font-medium text-white">
                          {(position.avgNoPrice * 100).toFixed(0)}¢
                        </p>
                      </div>
                    </>
                  )}
                  <div>
                    <p className="text-xs text-gray-500 mb-1">
                      {locale === "sr" ? "Isplata ako DA" : "Payout if YES"}
                    </p>
                    <p className="text-sm font-medium text-emerald-400">
                      ${position.potentialPayout.ifYes.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">
                      {locale === "sr" ? "Isplata ako NE" : "Payout if NO"}
                    </p>
                    <p className="text-sm font-medium text-red-400">
                      ${position.potentialPayout.ifNo.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
