"use client";

import { useEffect, useState, useCallback } from "react";
import { MarketCard } from "@/components/markets/MarketCard";
import { cn } from "@/lib/utils";
import { Search, Filter, Loader2 } from "lucide-react";

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

const categories = [
  { value: "", label: "All" },
  { value: "sports", label: "Sports" },
  { value: "politics", label: "Politics" },
  { value: "crypto", label: "Crypto" },
  { value: "economy", label: "Economy" },
  { value: "entertainment", label: "Entertainment" },
  { value: "other", label: "Other" },
];

const sortOptions = [
  { value: "createdAt", label: "Newest" },
  { value: "volume", label: "Volume" },
  { value: "closeAt", label: "Ending Soon" },
];

export default function MarketsPage() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);

  const fetchMarkets = useCallback(async (reset = false) => {
    setLoading(true);
    const currentOffset = reset ? 0 : offset;
    
    const params = new URLSearchParams({
      status: "open",
      limit: "12",
      offset: currentOffset.toString(),
      sortBy,
      sortOrder: sortBy === "closeAt" ? "asc" : "desc",
    });

    if (selectedCategory) params.set("category", selectedCategory);
    if (searchQuery) params.set("search", searchQuery);

    try {
      const res = await fetch(`/api/markets?${params}`);
      const data = await res.json();

      if (reset) {
        setMarkets(data.markets);
        setOffset(data.markets.length);
      } else {
        setMarkets((prev) => [...prev, ...data.markets]);
        setOffset((prev) => prev + data.markets.length);
      }
      setHasMore(data.pagination.hasMore);
    } catch (error) {
      console.error("Failed to fetch markets:", error);
    } finally {
      setLoading(false);
    }
  }, [offset, selectedCategory, searchQuery, sortBy]);

  useEffect(() => {
    fetchMarkets(true);
  }, [selectedCategory, sortBy]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchMarkets(true);
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Markets</h1>
        <p className="text-gray-400">Trade on the outcomes of real-world events</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        {/* Search */}
        <form onSubmit={handleSearch} className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
          <input
            type="text"
            placeholder="Search markets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </form>

        {/* Category filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-gray-500" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-emerald-500"
          >
            {categories.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-emerald-500"
        >
          {sortOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Category pills */}
      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setSelectedCategory(cat.value)}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm font-medium transition-colors",
              selectedCategory === cat.value
                ? "bg-emerald-500 text-white"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Markets Grid */}
      {loading && markets.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 text-emerald-500 animate-spin" />
        </div>
      ) : markets.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-500 text-lg">No markets found</p>
          <p className="text-gray-600 text-sm mt-1">Try adjusting your filters</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {markets.map((market) => (
              <MarketCard key={market.id} market={market} />
            ))}
          </div>

          {/* Load more */}
          {hasMore && (
            <div className="flex justify-center mt-8">
              <button
                onClick={() => fetchMarkets(false)}
                disabled={loading}
                className="px-6 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Load More
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
