"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { useTransition, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({ className }: { className?: string }) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const switchLocale = (newLocale: string) => {
    // Save preference to localStorage
    localStorage.setItem("preferred-locale", newLocale);
    startTransition(() => {
      router.replace(pathname, { locale: newLocale });
    });
  };

  if (!mounted) {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        <span className="text-sm text-gray-400">🇬🇧 EN</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center gap-1 rounded-lg border border-gray-700 bg-gray-800/50 p-1",
        isPending && "opacity-50",
        className
      )}
    >
      <button
        onClick={() => switchLocale("en")}
        className={cn(
          "px-2 py-1 text-sm rounded-md transition-colors flex items-center gap-1",
          locale === "en"
            ? "bg-emerald-600 text-white"
            : "text-gray-400 hover:text-white hover:bg-gray-700"
        )}
        disabled={isPending}
      >
        🇬🇧 EN
      </button>
      <button
        onClick={() => switchLocale("sr")}
        className={cn(
          "px-2 py-1 text-sm rounded-md transition-colors flex items-center gap-1",
          locale === "sr"
            ? "bg-emerald-600 text-white"
            : "text-gray-400 hover:text-white hover:bg-gray-700"
        )}
        disabled={isPending}
      >
        🇷🇸 SR
      </button>
    </div>
  );
}
