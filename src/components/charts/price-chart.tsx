"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { 
  createChart, 
  IChartApi, 
  ISeriesApi, 
  AreaSeries,
  Time,
  AreaSeriesOptions,
  DeepPartial,
} from "lightweight-charts";
import { cn } from "@/lib/utils";

interface PriceChartProps {
  marketId: string;
  currentPrice?: number;
  className?: string;
}

type TimeRange = "1h" | "6h" | "24h" | "7d" | "all";

const timeRangeOptions: { label: string; value: TimeRange }[] = [
  { label: "1H", value: "1h" },
  { label: "6H", value: "6h" },
  { label: "24H", value: "24h" },
  { label: "7D", value: "7d" },
  { label: "All", value: "all" },
];

interface AreaDataPoint {
  time: Time;
  value: number;
}

export function PriceChart({ marketId, currentPrice, className }: PriceChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Area"> | null>(null);
  
  const [selectedRange, setSelectedRange] = useState<TimeRange>("24h");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastPrice, setLastPrice] = useState<number | null>(null);

  // Fetch and update chart data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const interval = selectedRange === "1h" ? "1m" : 
                       selectedRange === "6h" ? "5m" :
                       selectedRange === "24h" ? "5m" :
                       selectedRange === "7d" ? "1h" : "1h";

      const res = await fetch(
        `/api/markets/${marketId}/history?range=${selectedRange}&interval=${interval}`
      );
      
      if (!res.ok) {
        throw new Error("Failed to fetch price history");
      }

      const { data } = await res.json();

      if (seriesRef.current && data.length > 0) {
        const chartData: AreaDataPoint[] = data.map((point: { time: number; yesPrice: number }) => ({
          time: point.time as Time,
          value: point.yesPrice,
        }));
        
        seriesRef.current.setData(chartData);
        setLastPrice(data[data.length - 1].yesPrice);
        
        // Fit content to view
        chartRef.current?.timeScale().fitContent();
      } else if (data.length === 0) {
        // No data - show current price as single point if available
        if (currentPrice && seriesRef.current) {
          const now = Math.floor(Date.now() / 1000) as Time;
          seriesRef.current.setData([{ time: now, value: currentPrice * 100 }]);
          setLastPrice(currentPrice * 100);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load chart");
    } finally {
      setLoading(false);
    }
  }, [marketId, selectedRange, currentPrice]);

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Create chart with dark theme
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: "transparent" },
        textColor: "#9ca3af",
      },
      grid: {
        vertLines: { color: "rgba(75, 85, 99, 0.2)" },
        horzLines: { color: "rgba(75, 85, 99, 0.2)" },
      },
      crosshair: {
        mode: 0, // Normal crosshair
        vertLine: {
          color: "#6b7280",
          labelBackgroundColor: "#1f2937",
        },
        horzLine: {
          color: "#6b7280",
          labelBackgroundColor: "#1f2937",
        },
      },
      rightPriceScale: {
        borderColor: "rgba(75, 85, 99, 0.3)",
        scaleMargins: {
          top: 0.1,
          bottom: 0.1,
        },
      },
      timeScale: {
        borderColor: "rgba(75, 85, 99, 0.3)",
        timeVisible: true,
        secondsVisible: false,
      },
      handleScale: {
        axisPressedMouseMove: {
          time: true,
          price: true,
        },
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: true,
      },
    });

    // Add area series for YES price (v5 API)
    const areaSeriesOptions: DeepPartial<AreaSeriesOptions> = {
      lineColor: "#10b981",
      topColor: "rgba(16, 185, 129, 0.4)",
      bottomColor: "rgba(16, 185, 129, 0.0)",
      lineWidth: 2,
      priceFormat: {
        type: "custom",
        minMove: 0.1,
        formatter: (price: number) => `${price.toFixed(1)}¢`,
      },
    };

    const areaSeries = chart.addSeries(AreaSeries, areaSeriesOptions);

    // Set price scale to 0-100 range
    chart.priceScale("right").applyOptions({
      autoScale: false,
      scaleMargins: {
        top: 0.05,
        bottom: 0.05,
      },
    });
    
    areaSeries.applyOptions({
      autoscaleInfoProvider: () => ({
        priceRange: {
          minValue: 0,
          maxValue: 100,
        },
      }),
    });

    chartRef.current = chart;
    seriesRef.current = areaSeries;

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  // Fetch data when range changes
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Update with real-time price changes
  useEffect(() => {
    if (currentPrice && seriesRef.current && !loading) {
      const now = Math.floor(Date.now() / 1000) as Time;
      const priceInCents = currentPrice * 100;
      
      // Update the last data point or add a new one
      seriesRef.current.update({ time: now, value: priceInCents });
      setLastPrice(priceInCents);
    }
  }, [currentPrice, loading]);

  return (
    <div className={cn("relative", className)}>
      {/* Time range selector */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Price History</span>
          {lastPrice !== null && (
            <span className="text-lg font-semibold text-emerald-400">
              {lastPrice.toFixed(1)}¢
            </span>
          )}
        </div>
        <div className="flex bg-gray-800/50 rounded-lg p-0.5">
          {timeRangeOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setSelectedRange(option.value)}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded-md transition-colors",
                selectedRange === option.value
                  ? "bg-gray-700 text-white"
                  : "text-gray-400 hover:text-white"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart container */}
      <div className="relative h-64 w-full">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 z-10 rounded-lg">
            <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 z-10 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <div
          ref={chartContainerRef}
          className="w-full h-full rounded-lg overflow-hidden"
        />
      </div>
    </div>
  );
}
