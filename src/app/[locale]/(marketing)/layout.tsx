"use client";

import { usePathname } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { TrendingUp } from "lucide-react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations();
  
  const isAuthPage = pathname.includes("/login") || pathname.includes("/register");

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border/40 backdrop-blur-sm sticky top-0 z-50 bg-background/80">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight">{t("common.appName")}</span>
          </Link>

          <nav className="flex items-center gap-4">
            <LanguageSwitcher />
            {!isAuthPage && (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    {t("nav.login")}
                  </Button>
                </Link>
                <Link href="/register">
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {t("nav.register")}
                  </Button>
                </Link>
              </>
            )}
            {isAuthPage && (
              <Link href="/">
                <Button variant="ghost" size="sm">
                  ← {t("common.back")}
                </Button>
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8 mt-auto">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm">{t("common.copyright")}</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="#" className="hover:text-foreground transition-colors">
                {t("common.terms")}
              </Link>
              <Link href="#" className="hover:text-foreground transition-colors">
                {t("common.privacy")}
              </Link>
              <Link href="#" className="hover:text-foreground transition-colors">
                {t("common.contact")}
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
