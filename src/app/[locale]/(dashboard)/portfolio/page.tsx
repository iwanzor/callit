"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Briefcase } from "lucide-react";

export default function PortfolioPage() {
  const t = useTranslations("portfolio");
  const tLanding = useTranslations("landing");

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">{t("title")}</h1>
        <p className="text-gray-400">{t("subtitle")}</p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
        <Briefcase className="h-16 w-16 text-gray-600 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">{t("noPositions")}</h2>
        <p className="text-gray-400 mb-6">
          {t("startTrading")}
        </p>
        <Link
          href="/markets"
          className="inline-block px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors"
        >
          {tLanding("exploreMarkets")}
        </Link>
      </div>
    </div>
  );
}
