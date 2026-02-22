"use client";

import { useEffect, useState } from "react";
import {
  Receipt,
  Search,
  ArrowDownRight,
  ArrowUpRight,
  TrendingUp,
  Gift,
  DollarSign,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Transaction {
  id: string;
  userId: string;
  userEmail: string;
  type: "deposit" | "withdrawal" | "trade_buy" | "trade_sell" | "payout" | "fee" | "refund";
  amount: number;
  balanceAfter: number;
  status: "pending" | "completed" | "failed";
  createdAt: string;
  referenceType: string | null;
  referenceId: string | null;
}

const TYPE_STYLES = {
  deposit: { bg: "bg-emerald-500/10", text: "text-emerald-400", icon: ArrowDownRight },
  withdrawal: { bg: "bg-red-500/10", text: "text-red-400", icon: ArrowUpRight },
  trade_buy: { bg: "bg-blue-500/10", text: "text-blue-400", icon: TrendingUp },
  trade_sell: { bg: "bg-purple-500/10", text: "text-purple-400", icon: TrendingUp },
  payout: { bg: "bg-yellow-500/10", text: "text-yellow-400", icon: Gift },
  fee: { bg: "bg-gray-500/10", text: "text-gray-400", icon: DollarSign },
  refund: { bg: "bg-cyan-500/10", text: "text-cyan-400", icon: RefreshCw },
};

const STATUS_STYLES = {
  pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  completed: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  failed: "bg-red-500/20 text-red-400 border-red-500/30",
};

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  useEffect(() => {
    fetch("/api/admin/transactions")
      .then((res) => res.json())
      .then((data) => {
        setTransactions(data.transactions || []);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const filteredTransactions = transactions.filter((tx) => {
    if (typeFilter !== "all" && tx.type !== typeFilter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return tx.userEmail.toLowerCase().includes(query);
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Transactions</h1>
        <p className="text-gray-400">All platform transactions</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="all">All Types</option>
          <option value="deposit">Deposits</option>
          <option value="withdrawal">Withdrawals</option>
          <option value="trade_buy">Trade Buy</option>
          <option value="trade_sell">Trade Sell</option>
          <option value="payout">Payouts</option>
          <option value="fee">Fees</option>
          <option value="refund">Refunds</option>
        </select>
      </div>

      {/* Transactions Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-12">
            <Receipt className="h-12 w-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No transactions found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Balance After
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filteredTransactions.map((tx) => {
                  const style = TYPE_STYLES[tx.type];
                  const Icon = style.icon;
                  const isPositive = ["deposit", "payout", "trade_sell", "refund"].includes(tx.type);
                  
                  return (
                    <tr key={tx.id} className="hover:bg-gray-800/30">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className={cn("p-2 rounded-lg", style.bg)}>
                            <Icon className={cn("h-4 w-4", style.text)} />
                          </div>
                          <span className={cn("text-sm font-medium capitalize", style.text)}>
                            {tx.type.replace("_", " ")}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-white truncate max-w-[200px]">
                          {tx.userEmail}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p
                          className={cn(
                            "text-sm font-medium",
                            isPositive ? "text-emerald-400" : "text-red-400"
                          )}
                        >
                          {isPositive ? "+" : "-"}$
                          {Math.abs(tx.amount).toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                          })}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-white">
                          ${tx.balanceAfter.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                          })}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={cn(
                            "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border",
                            STATUS_STYLES[tx.status]
                          )}
                        >
                          {tx.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-400">
                          {new Date(tx.createdAt).toLocaleString()}
                        </p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
