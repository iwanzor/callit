"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { Clock, TrendingUp } from "lucide-react";

interface Market {
  id: string;
  slug: string;
  title: string;
  category: string | null;
  yesPrice: number;
  noPrice: number;
  totalVolume: number;
  closeAt: string | null;
  status: string;
  imageUrl?: string | null;
}

interface MarketCardProps {
  market: Market;
}

const categoryColors: Record<string, string> = {
  sports: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  politics: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  crypto: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  economy: "bg-green-500/20 text-green-400 border-green-500/30",
  entertainment: "bg-pink-500/20 text-pink-400 border-pink-500/30",
  other: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

function formatTimeRemaining(closeAt: string | null): string {
  if (!closeAt) return "No end date";
  
  const now = new Date();
  const close = new Date(closeAt);
  const diff = close.getTime() - now.getTime();
  
  if (diff < 0) return "Ended";
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (days > 30) {
    const months = Math.floor(days / 30);
    return `${months}mo left`;
  }
  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h left`;
  
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${minutes}m left`;
}

function formatVolume(volume: number): string {
  if (volume >= 1000000) return `$${(volume / 1000000).toFixed(1)}M`;
  if (volume >= 1000) return `$${(volume / 1000).toFixed(1)}K`;
  return `$${volume.toFixed(0)}`;
}

export function MarketCard({ market }: MarketCardProps) {
  const categoryColor = categoryColors[market.category || "other"] || categoryColors.other;
  
  return (
    <Link href={`/markets/${market.id}`}>
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 hover:bg-gray-900/80 transition-all cursor-pointer group">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <span
              className={cn(
                "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border mb-2",
                categoryColor
              )}
            >
              {market.category || "other"}
            </span>
            <h3 className="text-white font-semibold text-sm leading-tight line-clamp-2 group-hover:text-emerald-400 transition-colors">
              {market.title}
            </h3>
          </div>
        </div>

        {/* Prices */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 text-center">
            <p className="text-xs text-emerald-400 font-medium mb-1">YES</p>
            <p className="text-xl font-bold text-emerald-400">
              {(market.yesPrice * 100).toFixed(0)}¢
            </p>
          </div>
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-center">
            <p className="text-xs text-red-400 font-medium mb-1">NO</p>
            <p className="text-xl font-bold text-red-400">
              {(market.noPrice * 100).toFixed(0)}¢
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>{formatVolume(market.totalVolume)} Vol</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            <span>{formatTimeRemaining(market.closeAt)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
