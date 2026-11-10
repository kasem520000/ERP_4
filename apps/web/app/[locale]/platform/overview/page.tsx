/**
 * PHASE-035 §3 (T35-A4) — /{locale}/platform/overview (لوحة تحكم المنصة):
 * the platform control-panel DASHBOARD — the KPI overview the console
 * lacked (the tenant list stays one click away at /platform).
 *
 * Data: GET /api/v1/platform/overview through the BFF — tenant
 * counters/distributions + audit activity the platform scope reads
 * directly, plus the RLS-blocked subscription/device/e-invoicing slices
 * through the sanctioned definer projection (migration 0048 — grouped
 * counts only, so the dashboard never renders tenant-identifying rows).
 * Non-platform sessions get the localized "platform administration area"
 * notice (the API 403s + audits every escalation attempt — S-07, the
 * tenant-list screen's exact contract).
 */
import { notFound, redirect } from "next/navigation";
import type { JSX } from "react";

import { ErrorState, Icon } from "../../../../components/client-ui";
import type { IconName } from "@erp/ui";
import { Badge } from "@erp/ui";

import { AppShell } from "../../../../components/app-shell";
import { Card } from "../../../../components/card";
import { DefList, type DefItem } from "../../../../components/def-list";
import { InfoNotice } from "../../../../components/notices";
import { RetryButton } from "../../../../components/retry-button";
import { getDictionary, isLocale, type Locale } from "../../../../i18n/dictionaries";
import type { PlatformOverview } from "../../../../lib/api-types";
import { formatDateTime, localizedApiError, localizedStatus, localizedName, statusTone } from "../../../../lib/messages";
import { fetchApi, requireSessionToken } from "../../../../lib/server-api";

/** The eight KPI tiles — every number comes from the aggregate payload. */
function KpiTile({ label, value }: { label: string; value: number | string }): JSX.Element {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-subtle bg-surface-card p-4">
      <span dir="ltr" className="font-mono text-2xl tabular-nums text-gray-900">
        {value}
      </span>
      <span className="text-sm text-gray-600">{label}</span>
    </div>
  );
}

/** A distribution bar row (label + count + proportional bar). */
function BarRow({
  label,
  count,
  max,
  badge,
}: {
  label: string;
  count: number;
  max: number;
  badge?: JSX.Element;
}): JSX.Element {
  const width = max > 0 ? Math.max(4, Math.round((count / max) * 100)) : 0;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-2 text-sm text-gray-700">
          <span className="truncate">{label}</span>
          {badge}
        </span>
        <span dir="ltr" className="font-mono text-sm tabular-nums text-gray-900">
          {count}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-sm bg-gray-200">
        <div className="h-full rounded-sm bg-primary-600" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

export default async function PlatformOverviewPage({
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

  await requireSessionToken(localeValue);

  const overview = await fetchApi<PlatformOverview>("platform/overview");
  if (!overview.ok && overview.status === 401) {
    redirect(`/${locale}/login`);
  }

  let content: JSX.Element;
  if (!overview.ok) {
    const forbidden = overview.status === 403 || overview.error.code === "FORBIDDEN";
    content = forbidden ? (
      <InfoNotice>{d.platformNoAccess}</InfoNotice>
    ) : (
      <ErrorState
        title={localizedApiError(d, overview.error, overview.retryAfterSeconds)}
        retry={<RetryButton label={d.retryLabel} />}
      />
    );
  } else {
    const stats = overview.data;
    const statusMax = Math.max(1, ...stats.tenantsByStatus.map((row) => row.count));
    const planMax = Math.max(1, ...stats.planDistribution.map((row) => row.count));
    const industryMax = Math.max(1, ...stats.industryDistribution.map((row) => row.count));
    const countryMax = Math.max(1, ...stats.countryDistribution.map((row) => row.count));

    content = (
      <div className="flex flex-col gap-6">
        <p className="max-w-3xl text-sm text-gray-600">{d.platformOverviewIntro}</p>

        {/* ------------------------------------------------- the KPI strip */}
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          <KpiTile label={d.platformOverviewTenantsTotal} value={stats.tenantsTotal} />
          <KpiTile label={d.platformOverviewNew30d} value={stats.newTenants30d} />
          <KpiTile label={d.platformOverviewNew7d} value={stats.newTenants7d} />
          <KpiTile label={d.platformOverviewAudit24h} value={stats.auditLast24h} />
          <KpiTile label={d.platformOverviewAudit7d} value={stats.auditLast7d} />
          <KpiTile label={d.platformOverviewDevicesActive} value={stats.devices.active} />
          <KpiTile label={d.platformOverviewDevicesRevoked} value={stats.devices.revoked} />
          <KpiTile label={d.platformOverviewStatusHeading} value={stats.tenantsByStatus.length} />
        </dl>

        {/* ------------------------------------------------ quick shortcuts */}
        <Card title={d.platformOverviewQuickLinks}>
          <nav className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {(
              [
                { href: "platform", label: d.platformOverviewQuickTenants, icon: "building" },
                { href: "platform/audit", label: d.platformOverviewQuickAudit, icon: "file-text" },
                { href: "platform/devices", label: d.platformOverviewQuickDevices, icon: "shield" },
                { href: "platform/sync-health", label: d.platformOverviewQuickSync, icon: "arrow-left-right" },
                { href: "platform/slo", label: d.platformOverviewQuickSlo, icon: "bar-chart" },
                { href: "platform/einvoicing-funnel", label: d.platformOverviewQuickEinvoicing, icon: "send" },
              ] as ReadonlyArray<{ href: string; label: string; icon: IconName }>
            ).map((link) => (
              <a
                key={link.href}
                href={`/${locale}/${link.href}`}
                className="flex items-center gap-2 rounded-md border border-default bg-surface-card px-3 py-2 text-sm text-gray-800 outline-none transition-colors duration-150 ease-standard hover:border-strong hover:bg-surface-sunken"
              >
                <Icon name={link.icon} size={16} />
                <span className="truncate">{link.label}</span>
              </a>
            ))}
          </nav>
        </Card>

        {/* --------------------------------------------- distributions row */}
        <div className="grid gap-4 lg:grid-cols-2">
          <Card title={d.platformOverviewStatusHeading}>
            <div className="flex flex-col gap-3">
              {stats.tenantsByStatus.map((row) => (
                <BarRow
                  key={row.status}
                  label={localizedStatus(d, row.status)}
                  count={row.count}
                  max={statusMax}
                  badge={<Badge tone={statusTone(row.status)}>{row.status}</Badge>}
                />
              ))}
            </div>
          </Card>

          <Card title={d.platformOverviewPlansHeading}>
            {stats.planDistribution.length === 0 ? (
              <p className="text-sm text-gray-600">{d.platformOverviewPlansEmpty}</p>
            ) : (
              <div className="flex flex-col gap-3">
                {stats.planDistribution.map((row) => (
                  <BarRow
                    key={row.planKey}
                    label={localizedName(row.planName, row.planNameAr, localeValue)}
                    count={row.count}
                    max={planMax}
                  />
                ))}
              </div>
            )}
          </Card>

          <Card title={d.platformOverviewIndustriesHeading}>
            {stats.industryDistribution.length === 0 ? (
              <p className="text-sm text-gray-600">{d.platformOverviewIndustriesEmpty}</p>
            ) : (
              <div className="flex flex-col gap-3">
                {stats.industryDistribution.map((row) => (
                  <BarRow
                    key={row.templateKey}
                    label={row.templateKey}
                    count={row.count}
                    max={industryMax}
                  />
                ))}
              </div>
            )}
          </Card>

          <Card title={d.platformOverviewCountriesHeading}>
            <div className="flex flex-col gap-3">
              {stats.countryDistribution.map((row) => (
                <BarRow
                  key={row.countryCode}
                  label={row.countryCode}
                  count={row.count}
                  max={countryMax}
                />
              ))}
            </div>
          </Card>
        </div>

        {/* ------------------------------------ subscriptions + e-invoicing */}
        <div className="grid gap-4 lg:grid-cols-2">
          <Card title={d.platformOverviewSubStatusHeading}>
            {stats.subscriptionStatuses.length === 0 ? (
              <p className="text-sm text-gray-600">{d.platformOverviewSubStatusEmpty}</p>
            ) : (
              <DefList
                items={stats.subscriptionStatuses.map(
                  (row): DefItem => ({
                    term: localizedStatus(d, row.status),
                    children: <span dir="ltr" className="font-mono tabular-nums">{row.count}</span>,
                  }),
                )}
              />
            )}
          </Card>

          <Card title={d.platformOverviewEinvoicingHeading}>
            {stats.einvoicingByStatus.length === 0 ? (
              <p className="text-sm text-gray-600">{d.platformOverviewEinvoicingEmpty}</p>
            ) : (
              <DefList
                items={stats.einvoicingByStatus.map(
                  (row): DefItem => ({
                    term: localizedStatus(d, row.status),
                    children: <span dir="ltr" className="font-mono tabular-nums">{row.count}</span>,
                  }),
                )}
              />
            )}
          </Card>
        </div>

        {/* ------------------------------------------- recent platform audit */}
        <Card title={d.platformOverviewActivityHeading}>
          {stats.recentAudit.length === 0 ? (
            <p className="text-sm text-gray-600">{d.platformOverviewActivityEmpty}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-100 border-collapse text-sm">
                <thead>
                  <tr className="border-b border-subtle">
                    <th scope="col" className="px-3 py-2 text-start font-semibold text-gray-800">
                      {d.platformAuditColAction}
                    </th>
                    <th scope="col" className="px-3 py-2 text-end font-semibold text-gray-800">
                      {d.platformAuditColAt}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentAudit.map((row) => (
                    <tr key={`${row.at}-${row.action}`} className="border-t border-subtle">
                      <td className="px-3 py-2 text-gray-700">
                        <span dir="ltr" className="font-mono text-xs text-gray-800">
                          {row.action}
                        </span>
                        <span className="ms-2 text-xs text-gray-500">{row.entityType}</span>
                      </td>
                      <td
                        dir="auto"
                        className="px-3 py-2 text-end font-mono text-xs tabular-nums text-gray-600"
                      >
                        {formatDateTime(row.at, localeValue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    );
  }

  return (
    <AppShell locale={localeValue} pagePath="platform/overview" title={d.platformOverviewTitle}>
      {content}
    </AppShell>
  );
}
