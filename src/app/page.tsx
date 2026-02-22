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
  BarChart3,
  Users,
  Activity,
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
      { next: { revalidate: 60 } } // Revalidate every 60 seconds
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

// Check if market is trending (high volume)
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
      "Winning shares pay $1 each. Sell anytime at market price, or hold until resolution.",
  },
];

// Market Card Component
function MarketCard({ market }: { market: Market }) {
  const yesPercent = Math.round(market.yesPrice * 100);
  const noPercent = Math.round(market.noPrice * 100);
  const trending = isTrending(market.totalVolume);

  return (
    <Link href={`/markets/${market.id}`}>
      <Card className="bg-card/50 border-border/50 backdrop-blur hover:border-emerald-500/50 transition-all cursor-pointer h-full group">
        <CardContent className="p-5">
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

          <h3 className="font-semibold mb-4 line-clamp-2 group-hover:text-emerald-400 transition-colors min-h-[3rem]">
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

// Resolved Market Card Component
function ResolvedMarketCard({ market }: { market: Market }) {
  const isYes = market.resolution === "yes";

  return (
    <Card className="bg-card/50 border-border/50 backdrop-blur">
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
    getMarkets("open", 6, "volume"),
    getResolvedMarkets(),
  ]);

  const totalVolume = marketsData.markets.reduce((sum, m) => sum + m.totalVolume, 0) + 
                      resolvedData.markets.reduce((sum, m) => sum + m.totalVolume, 0);
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border/40 backdrop-blur-sm sticky top-0 z-50 bg-background/80">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight">Callit</span>
          </Link>

          <nav className="flex items-center gap-4">
            <Link href="/markets" className="hidden sm:block">
              <Button variant="ghost" size="sm">
                Markets
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Log in
              </Button>
            </Link>
            <Link href="/register">
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Get Started
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-blue-500/10" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-900/20 via-transparent to-transparent" />

        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm mb-8">
              <Activity className="w-4 h-4" />
              <span>Real-time prediction markets</span>
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
              Predict the Future.{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-600">
                Profit from Knowledge.
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              Trade on the outcomes of real-world events. Politics, sports,
              crypto, and more. Your insights have value.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register">
                <Button
                  size="lg"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white h-14 px-8 text-lg"
                >
                  Start Trading
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/markets">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-14 px-8 text-lg border-border/60"
                >
                  Browse Markets
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-y border-border/40 bg-muted/20">
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-3 gap-8 max-w-3xl mx-auto">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <BarChart3 className="w-5 h-5 text-emerald-500" />
                <span className="text-2xl md:text-3xl font-bold text-emerald-500">
                  {formatVolume(totalVolume > 0 ? totalVolume : 15000000)}+
                </span>
              </div>
              <div className="text-sm text-muted-foreground">Total Volume</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Activity className="w-5 h-5 text-emerald-500" />
                <span className="text-2xl md:text-3xl font-bold text-emerald-500">
                  {marketsData.pagination.total || 20}+
                </span>
              </div>
              <div className="text-sm text-muted-foreground">Active Markets</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Users className="w-5 h-5 text-emerald-500" />
                <span className="text-2xl md:text-3xl font-bold text-emerald-500">
                  10K+
                </span>
              </div>
              <div className="text-sm text-muted-foreground">Traders</div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Markets Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-2 flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                Live Markets
              </h2>
              <p className="text-muted-foreground">
                Top markets by trading volume
              </p>
            </div>
            <Link href="/markets">
              <Button variant="outline" className="gap-2">
                View All
                <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          {marketsData.markets.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
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
        </div>
      </section>

      {/* Resolved Markets Section */}
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

      {/* How It Works */}
      <section className="py-16 border-t border-border/40">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              How It Works
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Get started in minutes. No complex setup required.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {steps.map((step, index) => (
              <Card
                key={step.title}
                className="bg-card/50 border-border/50 backdrop-blur relative overflow-hidden group"
              >
                <CardContent className="p-8">
                  <div className="absolute top-4 right-4 text-6xl font-bold text-muted/10">
                    {index + 1}
                  </div>
                  <div className="w-14 h-14 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-6 group-hover:bg-emerald-500/20 transition-colors">
                    <step.icon className="w-7 h-7 text-emerald-500" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 border-t border-border/40 bg-gradient-to-b from-background to-emerald-950/10">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-6">
              Ready to Put Your Knowledge to Work?
            </h2>
            <p className="text-xl text-muted-foreground mb-10">
              Join thousands of traders already profiting from their predictions.
              Start with as little as $10.
            </p>
            <Link href="/register">
              <Button
                size="lg"
                className="bg-emerald-600 hover:bg-emerald-700 text-white h-14 px-10 text-lg"
              >
                Create Free Account
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8 mt-auto">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm">© 2026 Callit. All rights reserved.</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="#" className="hover:text-foreground transition-colors">
                Terms
              </Link>
              <Link href="#" className="hover:text-foreground transition-colors">
                Privacy
              </Link>
              <Link href="#" className="hover:text-foreground transition-colors">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
