import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  TrendingUp,
  ArrowRight,
  Target,
  Zap,
  Wallet,
  ChevronRight,
  Clock,
  Flame,
  CheckCircle,
  XCircle,
} from "lucide-react";

// Types
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
  closeAt: string | null;
  imageUrl: string | null;
  createdAt: string;
}

interface MarketsResponse {
  markets: Market[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

// Server-side data fetching
async function getMarkets(status = "open", limit = 6, sortBy = "volume"): Promise<MarketsResponse> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  try {
    const res = await fetch(
      `${baseUrl}/api/markets?status=${status}&limit=${limit}&sortBy=${sortBy}&sortOrder=desc`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) throw new Error("Failed to fetch markets");
    return res.json();
  } catch (error) {
    console.error("Error fetching markets:", error);
    return { markets: [], pagination: { total: 0, limit, offset: 0, hasMore: false } };
  }
}

async function getResolvedMarkets(): Promise<MarketsResponse> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  try {
    const res = await fetch(
      `${baseUrl}/api/markets?status=resolved&limit=3&sortBy=createdAt&sortOrder=desc`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) throw new Error("Failed to fetch resolved markets");
    return res.json();
  } catch (error) {
    console.error("Error fetching resolved markets:", error);
    return { markets: [], pagination: { total: 0, limit: 3, offset: 0, hasMore: false } };
  }
}

// Format volume
function formatVolume(volume: number): string {
  if (volume >= 1000000) return `$${(volume / 1000000).toFixed(1)}M`;
  if (volume >= 1000) return `$${(volume / 1000).toFixed(0)}K`;
  return `$${volume.toFixed(0)}`;
}

// Format time remaining
function formatTimeRemaining(closeAt: string | null): string {
  if (!closeAt) return "No end date";
  const close = new Date(closeAt);
  const now = new Date();
  const diff = close.getTime() - now.getTime();
  
  if (diff < 0) return "Ended";
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);
  
  if (years > 0) return `${years}y ${months % 12}mo`;
  if (months > 0) return `${months}mo ${days % 30}d`;
  if (days > 0) return `${days}d`;
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  return `${hours}h`;
}

// Check if market is trending
function isTrending(volume: number): boolean {
  return volume >= 1000000;
}

// Category colors
function getCategoryColor(category: string | null): string {
  const colors: Record<string, string> = {
    politics: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    crypto: "bg-orange-500/10 text-orange-400 border-orange-500/30",
    sports: "bg-green-500/10 text-green-400 border-green-500/30",
    economy: "bg-purple-500/10 text-purple-400 border-purple-500/30",
    entertainment: "bg-pink-500/10 text-pink-400 border-pink-500/30",
    science: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
  };
  return colors[category || ""] || "bg-muted text-muted-foreground border-border";
}

const steps = [
  {
    icon: Target,
    title: "Pick a Market",
    description:
      "Browse thousands of markets on politics, sports, crypto, and more. Find questions you have insights on.",
  },
  {
    icon: Zap,
    title: "Trade YES or NO",
    description:
      "Buy shares based on your prediction. Prices reflect real-time market sentiment from 0¢ to $1.",
  },
  {
    icon: Wallet,
    title: "Cash Out",
    description:
      "If you're right, each share pays $1. Sell anytime before resolution or hold until the outcome.",
  },
];

// Market Card Component
function MarketCard({ market }: { market: Market }) {
  const yesPercent = Math.round(market.yesPrice * 100);
  const noPercent = Math.round(market.noPrice * 100);
  const trending = isTrending(market.totalVolume);

  return (
    <Link href={`/markets/${market.id}`}>
      <Card className="bg-card border-border/50 hover:border-emerald-500/50 transition-colors cursor-pointer group h-full">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className={`px-2 py-1 rounded-md text-xs font-medium border ${getCategoryColor(market.category)}`}>
              {market.category?.charAt(0).toUpperCase()}{market.category?.slice(1)}
            </span>
            {trending && (
              <span className="px-2 py-1 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-medium flex items-center gap-1">
                <Flame className="w-3 h-3" />
                Trending
              </span>
            )}
            <span className="text-xs text-muted-foreground ml-auto flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatTimeRemaining(market.closeAt)}
            </span>
          </div>

          <h3 className="font-semibold mb-4 group-hover:text-emerald-500 transition-colors line-clamp-2 min-h-[3rem]">
            {market.title}
          </h3>

          <div className="mb-4">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted-foreground">Probability</span>
              <span className="font-medium">{formatVolume(market.totalVolume)} vol</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden flex">
              <div 
                className="bg-emerald-500 transition-all"
                style={{ width: `${yesPercent}%` }}
              />
              <div 
                className="bg-red-500 transition-all"
                style={{ width: `${noPercent}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              size="sm"
              className={`flex-1 ${
                yesPercent >= 50 
                  ? "bg-emerald-600/30 hover:bg-emerald-600/40 text-emerald-400 border border-emerald-500/40"
                  : "bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30"
              }`}
            >
              YES {yesPercent}¢
            </Button>
            <Button
              size="sm"
              variant="outline"
              className={`flex-1 ${
                noPercent >= 50
                  ? "border-red-500/40 text-red-400 hover:bg-red-600/20 bg-red-600/10"
                  : "border-red-500/30 text-red-400 hover:bg-red-600/10"
              }`}
            >
              NO {noPercent}¢
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// Resolved Market Card
function ResolvedMarketCard({ market }: { market: Market }) {
  const isYes = market.resolution === "yes";

  return (
    <Card className="bg-card/50 border-border/50">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-full ${isYes ? "bg-emerald-500/20" : "bg-red-500/20"}`}>
            {isYes ? (
              <CheckCircle className="w-5 h-5 text-emerald-500" />
            ) : (
              <XCircle className="w-5 h-5 text-red-500" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm line-clamp-2">{market.title}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs font-semibold ${isYes ? "text-emerald-400" : "text-red-400"}`}>
                Resolved {isYes ? "YES" : "NO"}
              </span>
              <span className="text-xs text-muted-foreground">
                • {formatVolume(market.totalVolume)} volume
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default async function LandingPage() {
  const [marketsData, resolvedData] = await Promise.all([
    getMarkets("open", 3, "volume"),
    getResolvedMarkets(),
  ]);

  const totalVolume = marketsData.markets.reduce((sum, m) => sum + m.totalVolume, 0) + 
                      resolvedData.markets.reduce((sum, m) => sum + m.totalVolume, 0);

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/20 via-background to-background" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-emerald-500/10 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 relative">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm mb-6">
              <TrendingUp className="w-4 h-4" />
              <span>Real-time prediction markets</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Predict the Future.
              <br />
              <span className="text-emerald-500">Profit from Knowledge.</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Trade on the outcomes of real-world events. From elections to
              earnings, sports to science—put your predictions to the test.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register">
                <Button
                  size="lg"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 h-12 text-base"
                >
                  Start Trading
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href="/markets">
                <Button
                  variant="outline"
                  size="lg"
                  className="px-8 h-12 text-base"
                >
                  Explore Markets
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 mt-16 pt-8 border-t border-border/40">
              <div>
                <div className="text-2xl md:text-3xl font-bold text-emerald-500">
                  {formatVolume(totalVolume > 0 ? totalVolume : 15000000)}+
                </div>
                <div className="text-sm text-muted-foreground">
                  Trading Volume
                </div>
              </div>
              <div>
                <div className="text-2xl md:text-3xl font-bold text-emerald-500">
                  10K+
                </div>
                <div className="text-sm text-muted-foreground">
                  Active Traders
                </div>
              </div>
              <div>
                <div className="text-2xl md:text-3xl font-bold text-emerald-500">
                  {marketsData.pagination.total || 20}+
                </div>
                <div className="text-sm text-muted-foreground">
                  Live Markets
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              How It Works
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Start trading predictions in three simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {steps.map((step, index) => (
              <Card
                key={index}
                className="bg-card/50 border-border/50 backdrop-blur relative overflow-hidden group"
              >
                <CardContent className="p-6">
                  <div className="absolute top-4 right-4 text-6xl font-bold text-muted/20">
                    {index + 1}
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4 group-hover:bg-emerald-500/20 transition-colors">
                    <step.icon className="w-6 h-6 text-emerald-500" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Markets */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                Featured Markets
              </h2>
              <p className="text-muted-foreground">
                Popular predictions trending now
              </p>
            </div>
            <Link href="/markets" className="hidden sm:block">
              <Button variant="ghost" className="text-emerald-500">
                View All
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>

          {marketsData.markets.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-6">
              {marketsData.markets.map((market) => (
                <MarketCard key={market.id} market={market} />
              ))}
            </div>
          ) : (
            <Card className="bg-card/50 border-border/50">
              <CardContent className="py-12 text-center">
                <TrendingUp className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No active markets yet. Check back soon!</p>
              </CardContent>
            </Card>
          )}

          <div className="mt-8 text-center sm:hidden">
            <Link href="/markets">
              <Button variant="outline">
                View All Markets
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Resolved Markets */}
      {resolvedData.markets.length > 0 && (
        <section className="py-12 bg-muted/20 border-y border-border/40">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                Recent Results
              </h2>
              <Link href="/markets?status=resolved">
                <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground hover:text-foreground">
                  See all
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {resolvedData.markets.map((market) => (
                <ResolvedMarketCard key={market.id} market={market} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-b from-background to-emerald-950/20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Make Your Predictions?
          </h2>
          <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
            Join thousands of traders who profit from their knowledge and
            insights.
          </p>
          <Link href="/register">
            <Button
              size="lg"
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 h-12 text-base"
            >
              Create Free Account
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
