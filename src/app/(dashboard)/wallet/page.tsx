"use client";

import { useEffect, useState } from "react";
import { Wallet, ArrowUpRight, ArrowDownRight, History } from "lucide-react";

export default function WalletPage() {
  const [balance, setBalance] = useState<number | null>(null);
  const [frozenBalance, setFrozenBalance] = useState<number>(0);

  useEffect(() => {
    fetch("/api/user/balance")
      .then((res) => res.json())
      .then((data) => {
        setBalance(data.balance ?? 1000.00);
        setFrozenBalance(data.frozenBalance ?? 0);
      })
      .catch(() => {
        setBalance(1000.00);
      });
  }, []);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Wallet</h1>
        <p className="text-gray-400">Manage your funds</p>
      </div>

      {/* Balance cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <p className="text-sm text-gray-400 mb-1">Available Balance</p>
          <p className="text-3xl font-bold text-white">
            ${balance !== null ? (balance - frozenBalance).toLocaleString("en-US", { minimumFractionDigits: 2 }) : "—"}
          </p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <p className="text-sm text-gray-400 mb-1">In Open Orders</p>
          <p className="text-3xl font-bold text-yellow-400">
            ${frozenBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <p className="text-sm text-gray-400 mb-1">Total Balance</p>
          <p className="text-3xl font-bold text-emerald-400">
            ${balance !== null ? balance.toLocaleString("en-US", { minimumFractionDigits: 2 }) : "—"}
          </p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <button className="flex items-center justify-center gap-2 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition-colors">
          <ArrowDownRight className="h-5 w-5" />
          Deposit
        </button>
        <button className="flex items-center justify-center gap-2 py-4 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-semibold transition-colors">
          <ArrowUpRight className="h-5 w-5" />
          Withdraw
        </button>
      </div>

      {/* Transaction history */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <History className="h-5 w-5 text-gray-400" />
          Transaction History
        </h2>
        <div className="text-center py-8">
          <Wallet className="h-12 w-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No transactions yet</p>
        </div>
      </div>
    </div>
  );
}
