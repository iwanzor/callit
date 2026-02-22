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
} from "lucide-react";

const featuredMarkets = [
  {
    id: 1,
    question: "Will Bitcoin exceed $150,000 by end of 2026?",
    yesPrice: 0.42,
    volume: "$2.4M",
    category: "Crypto",
  },
  {
    id: 2,
    question: "Will the Fed cut rates before July 2026?",
    yesPrice: 0.68,
    volume: "$890K",
    category: "Economy",
  },
  {
    id: 3,
    question: "Will SpaceX complete a Mars mission by 2030?",
    yesPrice: 0.31,
    volume: "$1.2M",
    category: "Science",
  },
];

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

export default function LandingPage() {
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
                  $50M+
                </div>
                <div className="text-sm text-muted-foreground">
                  Trading Volume
                </div>
              </div>
              <div>
                <div className="text-2xl md:text-3xl font-bold text-emerald-500">
                  100K+
                </div>
                <div className="text-sm text-muted-foreground">
                  Active Traders
                </div>
              </div>
              <div>
                <div className="text-2xl md:text-3xl font-bold text-emerald-500">
                  5,000+
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
              <h2 className="text-3xl md:text-4xl font-bold mb-2">
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

          <div className="grid md:grid-cols-3 gap-6">
            {featuredMarkets.map((market) => (
              <Card
                key={market.id}
                className="bg-card border-border/50 hover:border-emerald-500/50 transition-colors cursor-pointer group"
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                      {market.category}
                    </span>
                    <span className="text-xs text-muted-foreground ml-auto">
                      Vol: {market.volume}
                    </span>
                  </div>
                  <h3 className="font-semibold mb-4 group-hover:text-emerald-500 transition-colors">
                    {market.question}
                  </h3>
                  <div className="flex items-center gap-3">
                    <Button
                      size="sm"
                      className="flex-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-500 border border-emerald-500/30"
                    >
                      YES {Math.round(market.yesPrice * 100)}¢
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 border-red-500/30 text-red-400 hover:bg-red-500/10"
                    >
                      NO {Math.round((1 - market.yesPrice) * 100)}¢
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

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
