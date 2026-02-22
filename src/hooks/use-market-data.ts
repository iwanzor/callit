"use client";

import useSWR from "swr";

interface OrderBookLevel {
  price: number;
  quantity: number;
  orders: number;
}

interface OrderBook {
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  summary: {
    bestBid: number | null;
    bestAsk: number | null;
    spread: number | null;
    bidDepth: number;
    askDepth: number;
  };
}

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

interface MarketDataResponse {
  market: Market;
  orderBook: {
    yes: { price: number; quantity: number }[];
    no: { price: number; quantity: number }[];
  };
  priceHistory: { yesPrice: number; volume: number; timestamp: string }[];
}

// Fetcher function for SWR
const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
};

// Auth fetcher for protected routes
const authFetcher = async (url: string) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
};

/**
 * Hook for real-time market data using SWR polling
 * Polls every 2 seconds for live updates
 */
export function useMarketData(marketId: string, enabled = true) {
  const { data, error, isLoading, mutate } = useSWR<MarketDataResponse>(
    enabled ? `/api/markets/${marketId}` : null,
    fetcher,
    {
      refreshInterval: 2000, // Poll every 2 seconds
      revalidateOnFocus: true,
      dedupingInterval: 1000, // Prevent duplicate requests within 1 second
    }
  );

  return {
    market: data?.market ?? null,
    orderBook: data?.orderBook ?? { yes: [], no: [] },
    priceHistory: data?.priceHistory ?? [],
    isLoading,
    isError: !!error,
    error,
    refresh: mutate,
  };
}

/**
 * Hook for real-time order book data
 * Uses a faster polling interval for the order book specifically
 */
export function useOrderBook(marketId: string, enabled = true) {
  const { data, error, isLoading, mutate } = useSWR<{
    marketId: string;
    lastPrice: number;
    bids: OrderBookLevel[];
    asks: OrderBookLevel[];
    summary: OrderBook["summary"];
  }>(
    enabled ? `/api/markets/${marketId}/orderbook` : null,
    fetcher,
    {
      refreshInterval: 2000, // Poll every 2 seconds
      revalidateOnFocus: true,
      dedupingInterval: 500,
    }
  );

  return {
    lastPrice: data?.lastPrice ?? null,
    bids: data?.bids ?? [],
    asks: data?.asks ?? [],
    summary: data?.summary ?? {
      bestBid: null,
      bestAsk: null,
      spread: null,
      bidDepth: 0,
      askDepth: 0,
    },
    isLoading,
    isError: !!error,
    error,
    refresh: mutate,
  };
}

/**
 * Hook for markets list with periodic updates
 * Uses a slower polling interval (10 seconds) for the main list
 */
export function useMarketsList(enabled = true) {
  const { data, error, isLoading, mutate } = useSWR<{ markets: Market[] }>(
    enabled ? "/api/markets?status=open&limit=50" : null,
    fetcher,
    {
      refreshInterval: 10000, // Poll every 10 seconds for list
      revalidateOnFocus: true,
      dedupingInterval: 5000,
    }
  );

  return {
    markets: data?.markets ?? [],
    isLoading,
    isError: !!error,
    error,
    refresh: mutate,
  };
}

/**
 * Hook for user balance updates
 */
export function useUserBalance(enabled = true) {
  const { data, error, isLoading, mutate } = useSWR<{ balance: number; frozenBalance: number }>(
    enabled ? "/api/user/balance" : null,
    authFetcher,
    {
      refreshInterval: 5000, // Poll every 5 seconds
      revalidateOnFocus: true,
    }
  );

  return {
    balance: data?.balance ?? 0,
    frozenBalance: data?.frozenBalance ?? 0,
    availableBalance: (data?.balance ?? 0) - (data?.frozenBalance ?? 0),
    isLoading,
    isError: !!error,
    refresh: mutate,
  };
}

/**
 * Hook for recent trades
 */
export function useRecentTrades(marketId: string, limit = 20, enabled = true) {
  const { data, error, isLoading, mutate } = useSWR<{
    trades: {
      id: string;
      side: "yes" | "no";
      price: number;
      quantity: number;
      createdAt: string;
    }[];
  }>(
    enabled ? `/api/markets/${marketId}/trades?limit=${limit}` : null,
    fetcher,
    {
      refreshInterval: 3000, // Poll every 3 seconds
      revalidateOnFocus: true,
    }
  );

  return {
    trades: data?.trades ?? [],
    isLoading,
    isError: !!error,
    error,
    refresh: mutate,
  };
}

/**
 * Hook for user positions (portfolio)
 */
export function usePositions(marketId?: string, enabled = true) {
  const url = marketId ? `/api/positions?marketId=${marketId}` : "/api/positions";
  
  const { data, error, isLoading, mutate } = useSWR<{
    positions: {
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
      totalValue: number;
      totalCost: number;
      unrealizedPnl: number;
      realizedPnl: number;
      potentialPayout: {
        ifYes: number;
        ifNo: number;
      };
    }[];
    summary: {
      totalValue: number;
      totalCost: number;
      totalUnrealizedPnl: number;
      totalRealizedPnl: number;
      positionCount: number;
    };
  }>(
    enabled ? url : null,
    authFetcher,
    {
      refreshInterval: 10000, // Poll every 10 seconds
      revalidateOnFocus: true,
    }
  );

  return {
    positions: data?.positions ?? [],
    summary: data?.summary ?? null,
    isLoading,
    isError: !!error,
    error,
    refresh: mutate,
  };
}
