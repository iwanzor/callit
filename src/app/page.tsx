"use client";

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
      "Winning shares pay $1 each. Sell anytime at market price, or hold until resolution.",
  },
];

export default function LandingPage() {
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
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-blue-500/10" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-900/20 via-transparent to-transparent" />

        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm mb-8">
              <Zap className="w-4 h-4" />
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

            <div className="mt-12 flex items-center justify-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>$50M+ Volume</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>100K+ Traders</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>5,000+ Markets</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 border-t border-border/40">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
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

      {/* Featured Markets */}
      <section className="py-20 border-t border-border/40">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-2">
                Featured Markets
              </h2>
              <p className="text-muted-foreground">
                Popular questions being traded right now
              </p>
            </div>
            <Link href="/markets">
              <Button variant="ghost" className="gap-2">
                View All
                <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {featuredMarkets.map((market) => (
              <Card
                key={market.id}
                className="bg-card/50 border-border/50 backdrop-blur hover:border-emerald-500/50 transition-colors cursor-pointer"
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-400 text-xs font-medium">
                      {market.category}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {market.volume} volume
                    </span>
                  </div>

                  <h3 className="font-semibold mb-6 line-clamp-2">
                    {market.question}
                  </h3>

                  <div className="flex items-center gap-3">
                    <Button
                      size="sm"
                      className="flex-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30"
                    >
                      YES {Math.round(market.yesPrice * 100)}¢
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 border-red-500/30 text-red-400 hover:bg-red-600/10"
                    >
                      NO {Math.round((1 - market.yesPrice) * 100)}¢
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 border-t border-border/40">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
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
