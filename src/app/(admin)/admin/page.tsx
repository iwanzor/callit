"use client";

import { useEffect, useState } from "react";
import {
  Users,
  BarChart3,
  DollarSign,
  Clock,
  TrendingUp,
  TrendingDown,
  Activity,
} from "lucide-react";

interface Stats {
  totalUsers: number;
  totalVolume: number;
  activeMarkets: number;
  pendingResolutions: number;
  recentActivity: ActivityItem[];
}

interface ActivityItem {
  id: string;
  type: "user_joined" | "market_created" | "trade" | "resolution";
  description: string;
  timestamp: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((res) => res.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => {
        // Mock data for development
        setStats({
          totalUsers: 0,
          totalVolume: 0,
          activeMarkets: 0,
          pendingResolutions: 0,
          recentActivity: [],
        });
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  const statCards = [
    {
      name: "Total Users",
      value: stats?.totalUsers ?? 0,
      icon: Users,
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
    },
    {
      name: "Total Volume",
      value: `$${(stats?.totalVolume ?? 0).toLocaleString("en-US", {
        minimumFractionDigits: 2,
      })}`,
      icon: DollarSign,
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10",
    },
    {
      name: "Active Markets",
      value: stats?.activeMarkets ?? 0,
      icon: BarChart3,
      color: "text-purple-400",
      bgColor: "bg-purple-500/10",
    },
    {
      name: "Pending Resolutions",
      value: stats?.pendingResolutions ?? 0,
      icon: Clock,
      color: "text-yellow-400",
      bgColor: "bg-yellow-500/10",
    },
  ];

  const getActivityIcon = (type: ActivityItem["type"]) => {
    switch (type) {
      case "user_joined":
        return <Users className="h-4 w-4 text-blue-400" />;
      case "market_created":
        return <BarChart3 className="h-4 w-4 text-purple-400" />;
      case "trade":
        return <TrendingUp className="h-4 w-4 text-emerald-400" />;
      case "resolution":
        return <Activity className="h-4 w-4 text-yellow-400" />;
      default:
        return <Activity className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
        <p className="text-gray-400">Overview of platform activity</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat) => (
          <div
            key={stat.name}
            className="bg-gray-900 border border-gray-800 rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-white mb-1">{stat.value}</p>
            <p className="text-sm text-gray-400">{stat.name}</p>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Activity className="h-5 w-5 text-gray-400" />
          Recent Activity
        </h2>
        {stats?.recentActivity && stats.recentActivity.length > 0 ? (
          <div className="space-y-3">
            {stats.recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center gap-3 py-2 border-b border-gray-800 last:border-0"
              >
                <div className="p-2 rounded-lg bg-gray-800">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">
                    {activity.description}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(activity.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Activity className="h-12 w-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No recent activity</p>
          </div>
        )}
      </div>
    </div>
  );
}
