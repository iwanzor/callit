"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  BarChart3,
  Users,
  Receipt,
  LogOut,
  ShieldCheck,
  Menu,
  X,
} from "lucide-react";

interface AdminUser {
  email: string;
  isAdmin: boolean;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navigation: NavItem[] = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Markets", href: "/admin/markets", icon: BarChart3 },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Transactions", href: "/admin/transactions", icon: Receipt },
];

// Admin emails - hardcoded for now
const ADMIN_EMAILS = ["admin@callit.io"];
const ADMIN_EMAIL_SUFFIX = "@callit.io";

function isAdminEmail(email: string): boolean {
  return email.endsWith(ADMIN_EMAIL_SUFFIX) || ADMIN_EMAILS.includes(email);
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    // Check if user is admin
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user && (data.user.isAdmin || isAdminEmail(data.user.email))) {
          setUser(data.user);
        } else {
          // Not authorized - redirect to login
          router.push("/login?redirect=/admin");
        }
        setLoading(false);
      })
      .catch(() => {
        router.push("/login?redirect=/admin");
        setLoading(false);
      });
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-6 border-b border-gray-800">
        <ShieldCheck className="h-8 w-8 text-red-500" />
        <div>
          <span className="text-xl font-bold text-white">Admin</span>
          <span className="text-xs block text-gray-500">Callit Panel</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navigation.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/admin" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-red-500/20 text-red-400"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* User info & Back to app */}
      <div className="p-4 border-t border-gray-800 space-y-3">
        <div className="bg-gray-800/50 rounded-lg p-3">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
            Logged in as
          </p>
          <p className="text-sm font-medium text-white truncate">{user.email}</p>
        </div>
        <Link
          href="/markets"
          className="flex items-center justify-center gap-2 w-full py-2 px-3 text-sm font-medium bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Back to App
        </Link>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-950">
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

      {/* Main content */}
      <main className="lg:pl-64">
        <div className="px-4 sm:px-6 lg:px-8 py-8 pt-16 lg:pt-8">{children}</div>
      </main>
    </div>
  );
}
