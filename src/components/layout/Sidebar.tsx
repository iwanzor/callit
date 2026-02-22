"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import {
  BarChart3,
  Briefcase,
  Wallet,
  Settings,
  TrendingUp,
  Menu,
  X,
  LogOut,
} from "lucide-react";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

export function Sidebar() {
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations("nav");
  const tWallet = useTranslations("wallet");
  
  const [balance, setBalance] = useState<number | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navigation: NavItem[] = [
    { name: t("markets"), href: "/markets", icon: BarChart3 },
    { name: t("portfolio"), href: "/portfolio", icon: Briefcase },
    { name: t("wallet"), href: "/wallet", icon: Wallet },
    { name: t("settings"), href: "/settings", icon: Settings },
  ];

  useEffect(() => {
    // Fetch user balance
    const token = localStorage.getItem("accessToken");
    if (token) {
      fetch("/api/user/balance", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.balance !== undefined) {
            setBalance(data.balance);
          }
        })
        .catch(() => {
          setBalance(1000.00);
        });
    } else {
      setBalance(1000.00);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    window.location.href = `/${locale}`;
  };

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-6 border-b border-gray-800">
        <TrendingUp className="h-8 w-8 text-emerald-500" />
        <span className="text-xl font-bold text-white">Callit</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navigation.map((item) => {
          // Check if current path matches this nav item
          const itemPath = `/${locale}${item.href}`;
          const isActive = pathname === itemPath || pathname.startsWith(`${itemPath}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Language Switcher */}
      <div className="px-4 py-3 border-t border-gray-800">
        <LanguageSwitcher className="w-full justify-center" />
      </div>

      {/* Balance Display */}
      <div className="p-4 border-t border-gray-800">
        <div className="bg-gray-800/50 rounded-lg p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
            {tWallet("availableBalance")}
          </p>
          <p className="text-2xl font-bold text-white">
            ${balance !== null ? balance.toLocaleString("en-US", { minimumFractionDigits: 2 }) : "—"}
          </p>
          <Link
            href="/wallet"
            className="mt-3 block w-full py-2 px-3 text-center text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
          >
            {tWallet("deposit")}
          </Link>
        </div>
      </div>

      {/* Logout Button */}
      <div className="px-4 pb-4">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <LogOut className="h-5 w-5" />
          {t("logout")}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile menu button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-gray-800 text-white"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          "lg:hidden fixed inset-y-0 left-0 z-40 w-64 bg-gray-900 transform transition-transform duration-200 ease-in-out flex flex-col",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <SidebarContent />
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-gray-900 border-r border-gray-800">
        <SidebarContent />
      </aside>
    </>
  );
}
