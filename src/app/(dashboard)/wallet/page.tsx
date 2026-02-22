"use client";

import { useEffect, useState } from "react";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  History,
  X,
  Loader2,
  TrendingUp,
  Gift,
  DollarSign,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Transaction {
  id: string;
  type: "deposit" | "withdrawal" | "trade_buy" | "trade_sell" | "payout" | "fee" | "refund";
  amount: number;
  balanceAfter: number;
  status: "pending" | "completed" | "failed";
  createdAt: string;
}

const TYPE_STYLES = {
  deposit: { bg: "bg-emerald-500/10", text: "text-emerald-400", icon: ArrowDownRight, label: "Deposit" },
  withdrawal: { bg: "bg-red-500/10", text: "text-red-400", icon: ArrowUpRight, label: "Withdrawal" },
  trade_buy: { bg: "bg-blue-500/10", text: "text-blue-400", icon: TrendingUp, label: "Buy" },
  trade_sell: { bg: "bg-purple-500/10", text: "text-purple-400", icon: TrendingUp, label: "Sell" },
  payout: { bg: "bg-yellow-500/10", text: "text-yellow-400", icon: Gift, label: "Payout" },
  fee: { bg: "bg-gray-500/10", text: "text-gray-400", icon: DollarSign, label: "Fee" },
  refund: { bg: "bg-cyan-500/10", text: "text-cyan-400", icon: RefreshCw, label: "Refund" },
};

export default function WalletPage() {
  const [balance, setBalance] = useState<number | null>(null);
  const [frozenBalance, setFrozenBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingTx, setLoadingTx] = useState(true);
  
  // Modal states
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [amount, setAmount] = useState("");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  const fetchBalance = () => {
    fetch("/api/user/balance")
      .then((res) => res.json())
      .then((data) => {
        setBalance(data.balance ?? 0);
        setFrozenBalance(data.frozenBalance ?? 0);
      })
      .catch(() => {
        setBalance(0);
      });
  };

  const fetchTransactions = () => {
    setLoadingTx(true);
    fetch("/api/wallet/transactions")
      .then((res) => res.json())
      .then((data) => {
        setTransactions(data.transactions || []);
        setLoadingTx(false);
      })
      .catch(() => {
        setLoadingTx(false);
      });
  };

  useEffect(() => {
    fetchBalance();
    fetchTransactions();
  }, []);

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setProcessing(true);

    try {
      const res = await fetch("/api/wallet/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: parseFloat(amount) }),
      });

      const data = await res.json();

      if (res.ok) {
        setShowDepositModal(false);
        setAmount("");
        fetchBalance();
        fetchTransactions();
      } else {
        setError(data.error || "Failed to process deposit");
      }
    } catch {
      setError("Failed to process deposit");
    } finally {
      setProcessing(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setProcessing(true);

    try {
      const res = await fetch("/api/wallet/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: parseFloat(amount) }),
      });

      const data = await res.json();

      if (res.ok) {
        setShowWithdrawModal(false);
        setAmount("");
        fetchBalance();
        fetchTransactions();
      } else {
        setError(data.error || "Failed to process withdrawal");
      }
    } catch {
      setError("Failed to process withdrawal");
    } finally {
      setProcessing(false);
    }
  };

  const availableBalance = balance !== null ? balance - frozenBalance : 0;

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
            ${availableBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
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
        <button
          onClick={() => {
            setShowDepositModal(true);
            setError("");
            setAmount("");
          }}
          className="flex items-center justify-center gap-2 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition-colors"
        >
          <ArrowDownRight className="h-5 w-5" />
          Deposit
        </button>
        <button
          onClick={() => {
            setShowWithdrawModal(true);
            setError("");
            setAmount("");
          }}
          className="flex items-center justify-center gap-2 py-4 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-semibold transition-colors"
        >
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
        
        {loadingTx ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-8">
            <Wallet className="h-12 w-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No transactions yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => {
              const style = TYPE_STYLES[tx.type];
              const Icon = style.icon;
              const isPositive = ["deposit", "payout", "trade_sell", "refund"].includes(tx.type);
              
              return (
                <div
                  key={tx.id}
                  className="flex items-center justify-between py-3 border-b border-gray-800 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-lg", style.bg)}>
                      <Icon className={cn("h-4 w-4", style.text)} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">
                        {style.label}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(tx.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
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
                    <p className="text-xs text-gray-500">
                      Balance: ${tx.balanceAfter.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Deposit Modal */}
      {showDepositModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Deposit Funds</h2>
              <button
                onClick={() => setShowDepositModal(false)}
                className="p-1 text-gray-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <p className="text-sm text-gray-400 mb-4">
              This is a mocked deposit. Funds will be credited instantly.
            </p>

            <form onSubmit={handleDeposit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Amount (USD)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    $
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    max="10000"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="100.00"
                    className="w-full pl-8 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-400">{error}</p>
              )}

              {/* Quick amounts */}
              <div className="flex gap-2">
                {[50, 100, 250, 500].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setAmount(amt.toString())}
                    className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm transition-colors"
                  >
                    ${amt}
                  </button>
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDepositModal(false)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processing || !amount}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-600/50 text-white rounded-lg font-medium transition-colors"
                >
                  {processing && <Loader2 className="h-4 w-4 animate-spin" />}
                  Deposit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Withdraw Funds</h2>
              <button
                onClick={() => setShowWithdrawModal(false)}
                className="p-1 text-gray-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <p className="text-sm text-gray-400 mb-2">
              Available to withdraw: <span className="text-emerald-400 font-medium">${availableBalance.toFixed(2)}</span>
            </p>
            <p className="text-xs text-gray-500 mb-4">
              Minimum withdrawal: $10.00
            </p>

            <form onSubmit={handleWithdraw} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Amount (USD)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    $
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="10"
                    max={availableBalance}
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="100.00"
                    className="w-full pl-8 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-400">{error}</p>
              )}

              {/* Quick amounts */}
              <div className="flex gap-2">
                {[25, 50, 100].map((percent) => {
                  const amt = Math.floor(availableBalance * (percent / 100) * 100) / 100;
                  return (
                    <button
                      key={percent}
                      type="button"
                      onClick={() => setAmount(amt.toString())}
                      disabled={amt < 10}
                      className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm transition-colors"
                    >
                      {percent}%
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setAmount(availableBalance.toString())}
                  disabled={availableBalance < 10}
                  className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm transition-colors"
                >
                  Max
                </button>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowWithdrawModal(false)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processing || !amount || parseFloat(amount) < 10}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 text-white rounded-lg font-medium transition-colors"
                >
                  {processing && <Loader2 className="h-4 w-4 animate-spin" />}
                  Withdraw
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
