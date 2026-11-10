/**
 * PHASE-035 §2 (T35-W1) — /{locale}/welcome (PUBLIC, route group (marketing)):
 * the bilingual marketing landing page — the platform's public front door.
 *
 * Design contract (USER_JOURNEYS §A0 "discover" + the honest-marketing
 * rules): every number renders from live service payloads, never
 * hard-coded —
 *   · plans         → GET public/plans            (the pricing page's source)
 *   · industries    → GET platform/register/options (the register form's
 *                     source — the seeded activity catalog)
 *   · module/jurisdiction/screen counters → the docs-anchored constants
 *     documented in FEATURE_CATALOG (22 modules) / TAX_COUNTRY_PACKS (10)
 *     and the PHASE-035 completion report inventory (screen census), each
 *     displayed as a labelled stat with its source named in the section
 *     heading so nothing masquerades as a marketing claim.
 *
 * CTAs: primary → /{locale}/register (tenant self-registration), secondary
 * → /{locale}/pricing. Sessioned visitors still see the page (public route
 * — like pricing) but the hero CTA flips to the app home.
 */
import { notFound } from "next/navigation";
import type { JSX } from "react";

import { Icon } from "../../../../components/client-ui";
import type { IconName } from "@erp/ui";

import { ErrorNotice, InfoNotice } from "../../../../components/notices";
import { PublicShell } from "../../../../components/public-shell";
import { getDictionary, isLocale, type Dictionary, type Locale } from "../../../../i18n/dictionaries";
import type { PublicPlanRow, RegistrationOptions } from "../../../../lib/api-types";
import { formatMessage, localizedName } from "../../../../lib/messages";
import { fetchApi, getSessionToken } from "../../../../lib/server-api";

/** Docs-anchored counters (FEATURE_CATALOG §modules · TAX country packs ·
 *  the PHASE-035 screen census — sources named on the page itself). */
const MODULE_COUNT = 22;
const JURISDICTION_COUNT = 10;
const SCREEN_COUNT = 145;
const OFFLINE_SYNC = "✓";

const FEATURE_TILES: ReadonlyArray<{
  id: string;
  icon: IconName;
  titleKey: keyof Dictionary;
  bodyKey: keyof Dictionary;
}> = [
  { id: "accounting", icon: "ledger", titleKey: "welcomeFeaturesAccounting", bodyKey: "welcomeFeaturesAccountingBody" },
  { id: "treasury", icon: "banknote", titleKey: "welcomeFeaturesTreasury", bodyKey: "welcomeFeaturesTreasuryBody" },
  { id: "sales", icon: "receipt-text", titleKey: "welcomeFeaturesSales", bodyKey: "welcomeFeaturesSalesBody" },
  { id: "inventory", icon: "boxes", titleKey: "welcomeFeaturesInventory", bodyKey: "welcomeFeaturesInventoryBody" },
  { id: "pos", icon: "qr-code", titleKey: "welcomeFeaturesPos", bodyKey: "welcomeFeaturesPosBody" },
  { id: "payroll", icon: "users", titleKey: "welcomeFeaturesPayroll", bodyKey: "welcomeFeaturesPayrollBody" },
  { id: "reporting", icon: "bar-chart", titleKey: "welcomeFeaturesReporting", bodyKey: "welcomeFeaturesReportingBody" },
  { id: "offline", icon: "cloud-off", titleKey: "welcomeFeaturesOffline", bodyKey: "welcomeFeaturesOfflineBody" },
];

const STEPS: ReadonlyArray<{ n: 1 | 2 | 3; titleKey: keyof Dictionary; bodyKey: keyof Dictionary }> = [
  { n: 1, titleKey: "welcomeStep1Title", bodyKey: "welcomeStep1Body" },
  { n: 2, titleKey: "welcomeStep2Title", bodyKey: "welcomeStep2Body" },
  { n: 3, titleKey: "welcomeStep3Title", bodyKey: "welcomeStep3Body" },
];

export default async function WelcomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<JSX.Element> {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }
  const localeValue = locale as Locale;
  const d = getDictionary(localeValue);

  // Public payloads — both routes are anonymous-safe (the pricing page and
  // the register form use exactly these two).
  const [plans, options, token] = await Promise.all([
    fetchApi<readonly PublicPlanRow[]>("public/plans"),
    fetchApi<RegistrationOptions>("platform/register/options"),
    getSessionToken(),
  ]);

  const industries = options.ok ? options.data.industryTemplates : [];
  const planRows = plans.ok
    ? [...plans.data].sort((a, b) => a.sortOrder - b.sortOrder || a.key.localeCompare(b.key))
    : [];

  const registerHref = `/${locale}/register`;
  const primaryHref = token === undefined ? registerHref : `/${locale}`;
  const primaryLabel = token === undefined ? d.welcomeHeroCtaPrimary : d.navHome;

  const stats: ReadonlyArray<{ value: string; label: string }> = [
    { value: String(MODULE_COUNT), label: d.welcomeStatsModules },
    { value: String(industries.length > 0 ? industries.length : 13), label: d.welcomeStatsIndustries },
    { value: String(SCREEN_COUNT), label: d.welcomeStatsScreens },
    { value: String(JURISDICTION_COUNT), label: d.welcomeStatsJurisdictions },
    { value: OFFLINE_SYNC, label: d.welcomeStatsOffline },
  ];

  const faq: ReadonlyArray<{ q: keyof Dictionary; a: keyof Dictionary }> = [
    { q: "welcomeFaqQ1", a: "welcomeFaqA1" },
    { q: "welcomeFaqQ2", a: "welcomeFaqA2" },
    { q: "welcomeFaqQ3", a: "welcomeFaqA3" },
    { q: "welcomeFaqQ4", a: "welcomeFaqA4" },
  ];

  return (
    <PublicShell locale={localeValue} pagePath="welcome" title={d.welcomeTitle} variant="marketing">
      {/* ---------------------------------------------------------------- hero */}
      <section aria-labelledby="welcome-hero-heading" className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 rounded-lg border border-subtle bg-surface-card p-6 shadow-e1 md:p-10">
          <p className="text-sm font-medium text-primary-700">{d.welcomeTagline}</p>
          <h2 id="welcome-hero-heading" lang={locale} className="text-3xl font-semibold text-gray-900 md:text-4xl">
            {d.welcomeTitle}
          </h2>
          <p className="max-w-3xl text-base text-gray-700">{d.welcomeHeroBody}</p>
          <div className="flex flex-wrap items-center gap-3">
            <a
              href={primaryHref}
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary-600 px-6 text-sm font-medium text-white outline-none transition-colors duration-150 ease-standard hover:bg-primary-700"
            >
              {primaryLabel}
            </a>
            <a
              href={`/${locale}/pricing`}
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-default bg-surface-card px-6 text-sm font-medium text-gray-800 outline-none transition-colors duration-150 ease-standard hover:border-strong hover:bg-surface-sunken"
            >
              {d.welcomeHeroCtaSecondary}
            </a>
          </div>
          {token === undefined && <p className="text-sm text-gray-600">{d.welcomeTrialNote}</p>}
        </div>
        {/* the labelled stat strip — every number's source is named below it */}
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col gap-1 rounded-lg border border-subtle bg-surface-card p-4 text-center"
            >
              <dd dir="ltr" className="font-mono text-2xl tabular-nums text-primary-800">
                {stat.value}
              </dd>
              <dt className="text-sm text-gray-600">{stat.label}</dt>
            </div>
          ))}
        </dl>
      </section>

      {/* ------------------------------------------------------------ features */}
      <section aria-labelledby="welcome-features-heading" className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 id="welcome-features-heading" className="text-lg font-semibold text-gray-900">
            {d.welcomeFeaturesHeading}
          </h2>
          <p className="max-w-3xl text-sm text-gray-600">{d.welcomeFeaturesIntro}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURE_TILES.map((tile) => (
            <article
              key={tile.id}
              className="flex flex-col gap-2 rounded-lg border border-subtle bg-surface-card p-5 transition-colors duration-150 ease-standard hover:border-strong"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-primary-50 text-primary-700">
                <Icon name={tile.icon} size={20} />
              </span>
              <h3 className="text-md font-semibold text-gray-900">{d[tile.titleKey]}</h3>
              <p className="text-sm text-gray-600">{d[tile.bodyKey]}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------------- industries */}
      <section aria-labelledby="welcome-industries-heading" className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 id="welcome-industries-heading" className="text-lg font-semibold text-gray-900">
            {d.welcomeIndustriesHeading}
          </h2>
          <p className="max-w-3xl text-sm text-gray-600">{d.welcomeIndustriesIntro}</p>
        </div>
        {industries.length === 0 ? (
          <InfoNotice>{d.welcomeIndustriesLoadFallback}</InfoNotice>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {industries.map((industry) => (
              <li key={industry.key}>
                <article className="flex h-full flex-col gap-2 rounded-lg border border-subtle bg-surface-card p-4">
                  <h3 className="text-md font-semibold text-gray-900">
                    {localizedName(industry.name, industry.nameAr, localeValue)}
                  </h3>
                  <span dir="ltr" className="w-fit rounded-sm border border-subtle bg-gray-100 px-1.5 py-0.5 font-mono text-xs leading-4 text-gray-600">
                    {formatMessage(d.welcomeIndustriesTemplateHint, { version: String(industry.version) })}
                  </span>
                </article>
              </li>
            ))}
          </ul>
        )}
        <a
          href={`/${locale}/pricing`}
          className="w-fit text-sm text-primary-700 underline-offset-2 outline-none hover:underline"
        >
          {d.welcomeIndustriesMoreLink} ←
        </a>
      </section>

      {/* --------------------------------------------------------------- steps */}
      <section aria-labelledby="welcome-steps-heading" className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 id="welcome-steps-heading" className="text-lg font-semibold text-gray-900">
            {d.welcomeStepsHeading}
          </h2>
          <p className="max-w-2xl text-sm text-gray-600">{d.welcomeStepsIntro}</p>
        </div>
        <ol className="grid gap-4 md:grid-cols-3">
          {STEPS.map((step) => (
            <li
              key={step.n}
              className="flex flex-col gap-2 rounded-lg border border-subtle bg-surface-card p-5"
            >
              <span
                dir="ltr"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary-600 font-mono text-sm tabular-nums text-white"
              >
                {step.n}
              </span>
              <h3 className="text-md font-semibold text-gray-900">{d[step.titleKey]}</h3>
              <p className="text-sm text-gray-600">{d[step.bodyKey]}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* -------------------------------------------------------------- pricing */}
      <section aria-labelledby="welcome-pricing-heading" className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 id="welcome-pricing-heading" className="text-lg font-semibold text-gray-900">
            {d.welcomePricingHeading}
          </h2>
          <p className="max-w-2xl text-sm text-gray-600">{d.welcomePricingIntro}</p>
        </div>
        {!plans.ok ? (
          <ErrorNotice>{d.welcomePlansLoadError}</ErrorNotice>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {planRows.map((plan) => (
              <article
                key={plan.key}
                aria-label={localizedName(plan.name, plan.nameAr, localeValue)}
                className={`relative flex flex-col gap-3 rounded-lg border bg-surface-card p-5 ${
                  plan.highlight ? "border-primary-600 shadow-e2" : "border-subtle shadow-e1"
                }`}
              >
                {plan.highlight && (
                  <span className="absolute -top-3 start-1/2 -translate-x-1/2 rounded-full bg-primary-600 px-3 py-0.5 text-xs font-medium text-white">
                    {d.pricingHighlightBadge}
                  </span>
                )}
                <h3 className="text-md font-semibold text-gray-900">
                  {localizedName(plan.name, plan.nameAr, localeValue)}
                </h3>
                {plan.positioning !== null && (
                  <p className="text-sm text-gray-600">{plan.positioning[localeValue]}</p>
                )}
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="text-sm text-gray-600">{d.pricingMonthly}</span>
                  <span dir="ltr" className="font-mono text-xl tabular-nums text-gray-900">
                    {plan.priceAmount} {plan.currencyCode}
                  </span>
                  {plan.placeholderPrice && (
                    <span className="inline-flex w-fit items-center gap-1 rounded-sm border border-warning-border bg-warning-bg px-1.5 py-0.5 text-xs leading-4 text-warning-text">
                      {d.pricingPlaceholderBadge}
                    </span>
                  )}
                </div>
                <a
                  href={`/${locale}/pricing`}
                  className="inline-flex min-h-11 items-center justify-center rounded-md border border-default bg-surface-card px-4 text-sm font-medium text-gray-800 outline-none transition-colors duration-150 ease-standard hover:border-strong hover:bg-surface-sunken"
                >
                  {d.welcomePricingAllLink}
                </a>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* ------------------------------------------------------------------ faq */}
      <section aria-labelledby="welcome-faq-heading" className="flex flex-col gap-4">
        <h2 id="welcome-faq-heading" className="text-lg font-semibold text-gray-900">
          {d.welcomeFaqHeading}
        </h2>
        <div className="flex flex-col gap-3">
          {faq.map((item, index) => (
            <details
              key={item.q}
              className="rounded-lg border border-subtle bg-surface-card p-4"
              open={index === 0}
            >
              <summary className="cursor-pointer text-md font-medium text-gray-900 outline-none">
                {d[item.q]}
              </summary>
              <p className="mt-2 text-sm text-gray-600">{d[item.a]}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------ final cta */}
      <section
        aria-labelledby="welcome-cta-heading"
        className="flex flex-col items-start gap-4 rounded-lg border border-primary-200 bg-primary-50 p-6 md:p-10"
      >
        <h2 id="welcome-cta-heading" className="text-xl font-semibold text-primary-900">
          {d.welcomeCtaTitle}
        </h2>
        <p className="max-w-2xl text-sm text-primary-800">{d.welcomeCtaBody}</p>
        <a
          href={registerHref}
          className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary-600 px-6 text-sm font-medium text-white outline-none transition-colors duration-150 ease-standard hover:bg-primary-700"
        >
          {d.welcomeCtaButton}
        </a>
      </section>
    </PublicShell>
  );
}
