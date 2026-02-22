"use client";

import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Settings, User, Bell, Shield, Globe } from "lucide-react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default function SettingsPage() {
  const t = useTranslations("settings");
  const tLang = useTranslations("language");
  const locale = useLocale();

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">{t("title")}</h1>
        <p className="text-gray-400">{t("subtitle")}</p>
      </div>

      <div className="space-y-4">
        {/* Profile */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <User className="h-5 w-5 text-gray-400" />
            <h2 className="text-lg font-semibold text-white">{t("profile")}</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">{t("displayName")}</label>
              <input
                type="text"
                placeholder={locale === "sr" ? "Vaše ime za prikaz" : "Your display name"}
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">{t("emailAddress")}</label>
              <input
                type="email"
                placeholder={locale === "sr" ? "vas@email.com" : "your@email.com"}
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Language */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Globe className="h-5 w-5 text-gray-400" />
            <h2 className="text-lg font-semibold text-white">{t("language")}</h2>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-300">{locale === "sr" ? "Izabrani jezik" : "Selected language"}</p>
              <p className="text-sm text-gray-500">{tLang(locale as "en" | "sr")}</p>
            </div>
            <LanguageSwitcher />
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Bell className="h-5 w-5 text-gray-400" />
            <h2 className="text-lg font-semibold text-white">{t("notifications")}</h2>
          </div>
          <div className="space-y-3">
            <label className="flex items-center justify-between">
              <span className="text-gray-300">
                {locale === "sr" ? "Email obaveštenja" : "Email notifications"}
              </span>
              <input type="checkbox" className="w-5 h-5 rounded bg-gray-800 border-gray-700 text-emerald-500 focus:ring-emerald-500" />
            </label>
            <label className="flex items-center justify-between">
              <span className="text-gray-300">
                {locale === "sr" ? "Potvrde trgovanja" : "Trade confirmations"}
              </span>
              <input type="checkbox" defaultChecked className="w-5 h-5 rounded bg-gray-800 border-gray-700 text-emerald-500 focus:ring-emerald-500" />
            </label>
            <label className="flex items-center justify-between">
              <span className="text-gray-300">
                {locale === "sr" ? "Obaveštenja o razrešenju tržišta" : "Market resolution alerts"}
              </span>
              <input type="checkbox" defaultChecked className="w-5 h-5 rounded bg-gray-800 border-gray-700 text-emerald-500 focus:ring-emerald-500" />
            </label>
          </div>
        </div>

        {/* Security */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="h-5 w-5 text-gray-400" />
            <h2 className="text-lg font-semibold text-white">{t("security")}</h2>
          </div>
          <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors">
            {t("changePassword")}
          </button>
        </div>

        {/* Save button */}
        <button className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition-colors">
          {t("saveChanges")}
        </button>
      </div>
    </div>
  );
}
