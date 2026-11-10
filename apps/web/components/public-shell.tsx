/**
 * P5-T12 — Public (unauthenticated) shell for login / forgot-password /
 * accept-invitation / register: token background, slim brand bar with the
 * locale switch, and a centered card surface (no sidebar — no session yet).
 * T19-WEB (PHASE-014): `layout="page"` swaps the centered card for a wide
 * plain main (the marketing pricing page); default keeps the card surface
 * every existing public page uses.
 *
 * PHASE-035 (§2): `variant="marketing"` upgrades the slim bar into the
 * marketing navigation bar — brand link to /{locale}/welcome, inline links
 * to the pricing page, and the sign-in / get-started CTAs — plus a site
 * footer. Used by the welcome landing page (and available to pricing so
 * both public marketing surfaces share one header/footer contract).
 */
import type { JSX, ReactNode } from "react";

import { getDictionary, otherLocale, type Locale } from "../i18n/dictionaries";

export function PublicShell({
  locale,
  pagePath,
  title,
  layout = "card",
  variant = "default",
  children,
}: {
  locale: Locale;
  pagePath: string;
  title: string;
  /** "card" = centered max-w-lg card (default); "page" = wide plain surface. */
  layout?: "card" | "page";
  /** "marketing" = nav bar + footer (public marketing surfaces). */
  variant?: "default" | "marketing";
  children: ReactNode;
}): JSX.Element {
  const d = getDictionary(locale);
  const other = otherLocale(locale);

  if (variant === "marketing") {
    return (
      <div className="flex min-h-screen flex-col bg-surface-page">
        <header className="sticky top-0 z-10 border-b border-subtle bg-surface-card">
          <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-2">
            <div className="flex items-center gap-4">
              <a
                href={`/${locale}/welcome`}
                className="text-md font-semibold text-primary-900 outline-none"
              >
                {d.appTitle}
              </a>
              <nav aria-label={d.welcomeNavHome} className="hidden items-center gap-1 sm:flex">
                <a
                  href={`/${locale}/welcome`}
                  aria-current={pagePath === "welcome" ? "page" : undefined}
                  className="rounded-md px-2 py-1 text-sm text-gray-700 underline-offset-2 outline-none hover:bg-surface-sunken hover:underline"
                >
                  {d.welcomeNavHome}
                </a>
                <a
                  href={`/${locale}/pricing`}
                  aria-current={pagePath === "pricing" ? "page" : undefined}
                  className="rounded-md px-2 py-1 text-sm text-gray-700 underline-offset-2 outline-none hover:bg-surface-sunken hover:underline"
                >
                  {d.welcomeNavPricing}
                </a>
              </nav>
            </div>
            <div className="flex items-center gap-2">
              <a
                lang={other}
                hrefLang={other}
                href={`/${other}/${pagePath}`}
                className="rounded-md px-2 py-1 text-sm text-gray-700 underline-offset-2 outline-none hover:bg-surface-sunken hover:underline"
              >
                {d.switchLabel}
              </a>
              <a
                href={`/${locale}/login`}
                className="rounded-md px-3 py-1.5 text-sm text-gray-800 underline-offset-2 outline-none hover:bg-surface-sunken hover:underline"
              >
                {d.welcomeNavLogin}
              </a>
              <a
                href={`/${locale}/register`}
                className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary-600 px-4 py-1.5 text-sm font-medium text-white outline-none transition-colors duration-150 ease-standard hover:bg-primary-700"
              >
                {d.welcomeNavRegister}
              </a>
            </div>
          </div>
        </header>
        <main className="flex flex-1 px-4 py-8">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
            <h1 lang={locale} className="text-2xl font-semibold text-gray-900">
              {title}
            </h1>
            {children}
          </div>
        </main>
        <footer className="border-t border-subtle bg-surface-card">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-6 text-sm text-gray-600">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <span className="text-md font-semibold text-primary-900">{d.appTitle}</span>
              <nav aria-label={d.welcomeFooterProduct} className="flex flex-wrap items-center gap-4">
                <a
                  href={`/${locale}/welcome`}
                  className="underline-offset-2 outline-none hover:underline"
                >
                  {d.welcomeNavHome}
                </a>
                <a
                  href={`/${locale}/pricing`}
                  className="underline-offset-2 outline-none hover:underline"
                >
                  {d.welcomeNavPricing}
                </a>
                <a
                  href={`/${locale}/register`}
                  className="underline-offset-2 outline-none hover:underline"
                >
                  {d.welcomeNavRegister}
                </a>
                <a
                  href={`/${locale}/login`}
                  className="underline-offset-2 outline-none hover:underline"
                >
                  {d.welcomeNavLogin}
                </a>
              </nav>
            </div>
            <p>{d.welcomeFooterLangNote}</p>
            <p dir="ltr" className="text-xs text-gray-500">
              © {new Date().getFullYear()} — {d.welcomeFooterRights}
            </p>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-surface-page">
      <header className="flex items-center justify-between border-b border-subtle bg-surface-card px-4 py-2">
        <a href={`/${locale}/welcome`} className="text-md font-semibold text-primary-900 outline-none">
          {d.appTitle}
        </a>
        <a
          lang={other}
          hrefLang={other}
          href={`/${other}/${pagePath}`}
          className="rounded-md px-2 py-1 text-sm text-gray-700 underline-offset-2 outline-none hover:bg-surface-sunken hover:underline"
        >
          {d.switchLabel}
        </a>
      </header>
      <main className="flex flex-1 px-4 py-8">
        {layout === "card" ? (
          <div className="flex w-full flex-1 items-center justify-center">
            <div className="w-full max-w-lg">
              <div className="rounded-lg border border-subtle bg-surface-card p-6 shadow-e3">
                <h1 lang={locale} className="text-lg font-semibold text-gray-900">
                  {title}
                </h1>
                <div className="mt-4 flex flex-col gap-4">{children}</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
            <h1 lang={locale} className="text-2xl font-semibold text-gray-900">
              {title}
            </h1>
            {children}
          </div>
        )}
      </main>
    </div>
  );
}
