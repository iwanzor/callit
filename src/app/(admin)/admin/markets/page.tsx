"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  BarChart3,
  CheckCircle,
  XCircle,
  Clock,
  Edit,
  Gavel,
  Ban,
  Loader2,
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
  totalVolume: number;
  closeAt: string | null;
  createdAt: string;
}

interface CreateMarketForm {
  title: string;
  description: string;
  category: string;
  closeAt: string;
  resolutionCriteria: string;
}

const CATEGORIES = [
  "sports",
  "politics",
  "crypto",
  "economy",
  "entertainment",
  "other",
];

const STATUS_STYLES = {
  draft: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  open: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  closed: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  resolved: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
};

export default function AdminMarketsPage() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState<CreateMarketForm>({
    title: "",
    description: "",
    category: "other",
    closeAt: "",
    resolutionCriteria: "",
  });

  const fetchMarkets = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (searchQuery) params.set("search", searchQuery);
      params.set("limit", "100");

      // Fetch all statuses for admin view
      const statuses = ["open", "closed", "resolved", "cancelled", "draft"];
      const allMarkets: Market[] = [];

      for (const status of statuses) {
        if (statusFilter !== "all" && status !== statusFilter) continue;
        const p = new URLSearchParams();
        p.set("status", status);
        if (searchQuery) p.set("search", searchQuery);
        p.set("limit", "100");
        
        const res = await fetch(`/api/markets?${p.toString()}`);
        if (res.ok) {
          const data = await res.json();
          allMarkets.push(...data.markets);
        }
      }

      setMarkets(allMarkets);
    } catch (error) {
      console.error("Failed to fetch markets:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarkets();
  }, [statusFilter, searchQuery]);

  const handleCreateMarket = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      const res = await fetch("/api/markets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: createForm.title,
          description: `${createForm.description}\n\nResolution Criteria: ${createForm.resolutionCriteria}`,
          category: createForm.category,
          closeAt: createForm.closeAt || null,
        }),
      });

      if (res.ok) {
        setShowCreateModal(false);
        setCreateForm({
          title: "",
          description: "",
          category: "other",
          closeAt: "",
          resolutionCriteria: "",
        });
        fetchMarkets();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to create market");
      }
    } catch (error) {
      alert("Failed to create market");
    } finally {
      setCreating(false);
    }
  };

  const filteredMarkets = markets.filter((market) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        market.title.toLowerCase().includes(query) ||
        market.description?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Markets</h1>
          <p className="text-gray-400">Manage prediction markets</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors"
        >
          <Plus className="h-5 w-5" />
          Create Market
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search markets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="all">All Status</option>
          <option value="open">Open</option>
          <option value="closed">Closed</option>
          <option value="resolved">Resolved</option>
          <option value="cancelled">Cancelled</option>
          <option value="draft">Draft</option>
        </select>
      </div>

      {/* Markets Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
          </div>
        ) : filteredMarkets.length === 0 ? (
          <div className="text-center py-12">
            <BarChart3 className="h-12 w-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No markets found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Market
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Volume
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Yes Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Close Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filteredMarkets.map((market) => (
                  <tr key={market.id} className="hover:bg-gray-800/30">
                    <td className="px-6 py-4">
                      <div className="max-w-md">
                        <p className="text-sm font-medium text-white truncate">
                          {market.title}
                        </p>
                        <p className="text-xs text-gray-500 capitalize">
                          {market.category}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border",
                          STATUS_STYLES[market.status]
                        )}
                      >
                        {market.status === "resolved" && market.resolution && (
                          market.resolution === "yes" ? (
                            <CheckCircle className="h-3 w-3" />
                          ) : (
                            <XCircle className="h-3 w-3" />
                          )
                        )}
                        {market.status}
                        {market.resolution && ` (${market.resolution.toUpperCase()})`}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-white">
                        ${market.totalVolume.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-white">
                        {(market.yesPrice * 100).toFixed(0)}¢
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-400">
                        {market.closeAt
                          ? new Date(market.closeAt).toLocaleDateString()
                          : "—"}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {(market.status === "open" || market.status === "closed") && (
                          <Link
                            href={`/admin/markets/${market.id}/resolve`}
                            className="p-2 text-yellow-400 hover:bg-yellow-500/10 rounded-lg transition-colors"
                            title="Resolve"
                          >
                            <Gavel className="h-4 w-4" />
                          </Link>
                        )}
                        <Link
                          href={`/markets/${market.id}`}
                          className="p-2 text-gray-400 hover:bg-gray-700 rounded-lg transition-colors"
                          title="View"
                        >
                          <BarChart3 className="h-4 w-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Market Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-white mb-4">Create New Market</h2>
            <form onSubmit={handleCreateMarket} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  minLength={10}
                  value={createForm.title}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, title: e.target.value })
                  }
                  placeholder="Will Bitcoin reach $100k by end of 2025?"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Description
                </label>
                <textarea
                  value={createForm.description}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, description: e.target.value })
                  }
                  rows={3}
                  placeholder="Additional context about this market..."
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Resolution Criteria *
                </label>
                <textarea
                  required
                  value={createForm.resolutionCriteria}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      resolutionCriteria: e.target.value,
                    })
                  }
                  rows={2}
                  placeholder="How will this market be resolved? E.g., 'Based on CoinGecko price at midnight UTC on Dec 31, 2025'"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Category
                  </label>
                  <select
                    value={createForm.category}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, category: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Close Date
                  </label>
                  <input
                    type="datetime-local"
                    value={createForm.closeAt}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, closeAt: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-600/50 text-white rounded-lg font-medium transition-colors"
                >
                  {creating && <Loader2 className="h-4 w-4 animate-spin" />}
                  Create Market
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
