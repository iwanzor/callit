"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { TrendingUp, Loader2, AlertCircle, Check } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Password validation
  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasMinLength = password.length >= 8;
  const passwordsMatch = password === confirmPassword && password.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!acceptTerms) {
      setError(locale === "sr" 
        ? "Morate prihvatiti uslove korišćenja" 
        : "You must accept the terms and conditions");
      return;
    }

    if (password !== confirmPassword) {
      setError(locale === "sr" 
        ? "Lozinke se ne podudaraju" 
        : "Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.details?.fieldErrors) {
          const fieldErrors = data.details.fieldErrors;
          const firstError =
            fieldErrors.email?.[0] ||
            fieldErrors.password?.[0] ||
            t("registrationFailed");
          setError(firstError);
        } else {
          setError(data.error || t("registrationFailed"));
        }
        setIsLoading(false);
        return;
      }

      // Store tokens
      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);
      localStorage.setItem("user", JSON.stringify(data.user));

      // Redirect to markets with locale
      router.push(`/${locale}/markets`);
    } catch {
      setError(t("registrationFailed"));
      setIsLoading(false);
    }
  };

  const PasswordCheck = ({
    valid,
    children,
  }: {
    valid: boolean;
    children: React.ReactNode;
  }) => (
    <div
      className={`flex items-center gap-2 text-xs ${valid ? "text-emerald-500" : "text-muted-foreground"}`}
    >
      <div
        className={`w-4 h-4 rounded-full flex items-center justify-center ${valid ? "bg-emerald-500/20" : "bg-muted"}`}
      >
        {valid && <Check className="w-3 h-3" />}
      </div>
      {children}
    </div>
  );

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md border-border/50 bg-card/50 backdrop-blur">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-7 h-7 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl">{t("createAccount")}</CardTitle>
          <CardDescription>
            {t("createAccountSubtitle")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">{t("email")}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t("emailPlaceholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-background/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t("password")}</Label>
              <Input
                id="password"
                type="password"
                placeholder={t("passwordPlaceholder")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-background/50"
              />
              {password.length > 0 && (
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <PasswordCheck valid={hasMinLength}>
                    {locale === "sr" ? "8+ karaktera" : "8+ characters"}
                  </PasswordCheck>
                  <PasswordCheck valid={hasLowercase}>
                    {locale === "sr" ? "Malo slovo" : "Lowercase letter"}
                  </PasswordCheck>
                  <PasswordCheck valid={hasUppercase}>
                    {locale === "sr" ? "Veliko slovo" : "Uppercase letter"}
                  </PasswordCheck>
                  <PasswordCheck valid={hasNumber}>
                    {locale === "sr" ? "Broj" : "Number"}
                  </PasswordCheck>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">
                {locale === "sr" ? "Potvrdi lozinku" : "Confirm Password"}
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder={t("passwordPlaceholder")}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className={`bg-background/50 ${
                  confirmPassword.length > 0
                    ? passwordsMatch
                      ? "border-emerald-500/50 focus-visible:ring-emerald-500/20"
                      : "border-red-500/50 focus-visible:ring-red-500/20"
                    : ""
                }`}
              />
            </div>

            <div className="flex items-start gap-3 pt-2">
              <Checkbox
                id="terms"
                checked={acceptTerms}
                onCheckedChange={(checked) => setAcceptTerms(checked === true)}
                className="mt-0.5"
              />
              <Label
                htmlFor="terms"
                className="text-sm text-muted-foreground font-normal leading-relaxed cursor-pointer"
              >
                {locale === "sr" ? (
                  <>
                    Prihvatam{" "}
                    <Link
                      href="#"
                      className="text-emerald-500 hover:text-emerald-400"
                    >
                      Uslove korišćenja
                    </Link>{" "}
                    i{" "}
                    <Link
                      href="#"
                      className="text-emerald-500 hover:text-emerald-400"
                    >
                      Politiku privatnosti
                    </Link>
                  </>
                ) : (
                  <>
                    I agree to the{" "}
                    <Link
                      href="#"
                      className="text-emerald-500 hover:text-emerald-400"
                    >
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link
                      href="#"
                      className="text-emerald-500 hover:text-emerald-400"
                    >
                      Privacy Policy
                    </Link>
                  </>
                )}
              </Label>
            </div>

            <Button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-11"
              disabled={
                isLoading ||
                !hasLowercase ||
                !hasUppercase ||
                !hasNumber ||
                !hasMinLength ||
                !passwordsMatch ||
                !acceptTerms
              }
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t("creatingAccount")}
                </>
              ) : (
                t("createAccountBtn")
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            {t("haveAccount")}{" "}
            <Link
              href="/login"
              className="text-emerald-500 hover:text-emerald-400 font-medium"
            >
              {t("signInLink")}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
