"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Locale = "en" | "de";

const dictionary = {
  en: {
    "nav.platform": "Platform",
    "nav.social": "Social",
    "nav.newBot": "New Bot",
    "nav.bots": "Bots",
    "nav.accounts": "Accounts",
    "nav.course": "Course",
    "nav.points": "Points",
    "nav.discord": "Discord",
    "nav.comingSoon": "Coming soon",
    "nav.language": "Language",
    "profile.settings": "Settings",
    "profile.logout": "Log Out",
    "bots.title": "Bot Overview",
    "bots.subtitle": "Your grouped bots, organized by what they actually do.",
    "bots.newBot": "New Bot",
    "bots.tab.active": "Active",
    "bots.tab.error": "Error",
    "bots.tab.stopped": "Stopped",
    "bots.filter.allTypes": "All bot types",
    "bots.sort.newest": "Newest stops first",
    "bots.sort.fees": "Highest net fees",
    "bots.sort.apr": "Highest APR",
    "bots.group.v3": "V3 Bots",
    "bots.group.points": "Points Bots",
    "bots.group.hint": "Long biased liquidity",
    "bots.active": "Active",
    "bots.empty": "No bots here yet.",
    "accounts.title": "Accounts Detail",
    "accounts.subtitle": "Your connected exchange accounts and the bots running on them.",
    "accounts.add": "Add account",
    "accounts.count": "accounts",
    "course.title": "PerpPilot Fundamentals",
    "auth.welcome": "Welcome to Perp pilot",
    "auth.email": "Your e-mail",
    "auth.password": "Your password",
    "auth.start": "Start trading",
    "auth.firstTime": "First time here?",
    "auth.signup": "Sign up",
    "auth.google": "Login with google",
    "auth.apple": "Login with Apple",
    "auth.footer": "© Trade flow - All rights reserved",
    "auth.createAccount": "Create your account",
    "auth.name": "Your name",
    "auth.phone": "Your phone",
    "auth.confirmPassword": "Confirm your password",
    "auth.haveAccount": "Already have an account?",
    "auth.login": "Log in",
    "auth.quoteTag": "What they say",
    "auth.forgot": "Forgot password?",
    "auth.passwordMismatch": "Passwords do not match",
    "auth.required": "Required",
  },
  de: {
    "nav.platform": "Plattform",
    "nav.social": "Community",
    "nav.newBot": "Neuer Bot",
    "nav.bots": "Bots",
    "nav.accounts": "Konten",
    "nav.course": "Kurs",
    "nav.points": "Punkte",
    "nav.discord": "Discord",
    "nav.comingSoon": "Bald verfügbar",
    "nav.language": "Sprache",
    "profile.settings": "Einstellungen",
    "profile.logout": "Abmelden",
    "bots.title": "Bot-Übersicht",
    "bots.subtitle": "Deine Bots, gruppiert nach dem, was sie tatsächlich tun.",
    "bots.newBot": "Neuer Bot",
    "bots.tab.active": "Aktiv",
    "bots.tab.error": "Fehler",
    "bots.tab.stopped": "Gestoppt",
    "bots.filter.allTypes": "Alle Bot-Typen",
    "bots.sort.newest": "Zuletzt gestoppt zuerst",
    "bots.sort.fees": "Höchste Netto-Gebühren",
    "bots.sort.apr": "Höchste APR",
    "bots.group.v3": "V3 Bots",
    "bots.group.points": "Punkte-Bots",
    "bots.group.hint": "Long-orientierte Liquidität",
    "bots.active": "Aktiv",
    "bots.empty": "Hier gibt es noch keine Bots.",
    "accounts.title": "Kontodetails",
    "accounts.subtitle": "Deine verbundenen Börsenkonten und die Bots darauf.",
    "accounts.add": "Konto hinzufügen",
    "accounts.count": "Konten",
    "course.title": "PerpPilot Grundlagen",
    "auth.welcome": "Willkommen bei Perp pilot",
    "auth.email": "Deine E-Mail",
    "auth.password": "Dein Passwort",
    "auth.start": "Trading starten",
    "auth.firstTime": "Zum ersten Mal hier?",
    "auth.signup": "Registrieren",
    "auth.google": "Mit Google anmelden",
    "auth.apple": "Mit Apple anmelden",
    "auth.footer": "© Trade flow - Alle Rechte vorbehalten",
    "auth.createAccount": "Konto erstellen",
    "auth.name": "Dein Name",
    "auth.phone": "Deine Telefonnummer",
    "auth.confirmPassword": "Passwort bestätigen",
    "auth.haveAccount": "Du hast schon ein Konto?",
    "auth.login": "Anmelden",
    "auth.quoteTag": "Was sie sagen",
    "auth.forgot": "Passwort vergessen?",
    "auth.passwordMismatch": "Die Passwörter stimmen nicht überein",
    "auth.required": "Pflichtfeld",
  },
} as const;

export type MessageKey = keyof (typeof dictionary)["en"];

type I18nValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: MessageKey) => string;
};

const I18nContext = createContext<I18nValue | null>(null);
const STORAGE_KEY = "perppilot.locale";

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- read once from storage after hydration
      if (saved === "en" || saved === "de") setLocaleState(saved);
    } catch {
      // storage can be blocked; English stays the default
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore
    }
  }, []);

  const value = useMemo<I18nValue>(
    () => ({ locale, setLocale, t: (key) => dictionary[locale][key] ?? dictionary.en[key] }),
    [locale, setLocale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}
