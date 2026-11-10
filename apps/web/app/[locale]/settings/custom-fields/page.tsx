/**
 * PHASE-036 (P36-W) — /{locale}/settings/custom-fields (session): the
 * custom-fields manager. Definitions + picklists are readable by every
 * authenticated member (forms render for everyone); the mutating surfaces
 * gate on settings.custom_fields.manage / settings.picklists.manage
 * (server-checked per route — the flags only hide dead buttons) plus the
 * platform.custom_fields / platform.custom_picklists feature keys (BR-039).
 */
import { notFound, redirect } from "next/navigation";
import type { JSX } from "react";

import { ErrorState } from "../../../../components/client-ui";

import { AppShell } from "../../../../components/app-shell";
import { CustomFieldsManager } from "../../../../components/custom-fields-manager";
import { RetryButton } from "../../../../components/retry-button";
import { getDictionary, isLocale, type Locale } from "../../../../i18n/dictionaries";
import type {
  CurrentSession,
  CustomFieldDefinitionRow,
  CustomPicklistRow,
} from "../../../../lib/api-types";
import { localizedApiError } from "../../../../lib/messages";
import { fetchApi, requireSessionToken } from "../../../../lib/server-api";

export default async function CustomFieldsPage({
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

  const [definitions, picklists, session] = await Promise.all([
    fetchApi<readonly CustomFieldDefinitionRow[]>("settings/custom-fields"),
    fetchApi<readonly CustomPicklistRow[]>("settings/picklists"),
    fetchApi<CurrentSession>("identity/sessions/current"),
  ]);
  if ((!definitions.ok && definitions.status === 401) || (!session.ok && session.status === 401)) {
    redirect(`/${locale}/login`);
  }

  let content: JSX.Element;
  if (!definitions.ok) {
    const forbidden = definitions.status === 403 || definitions.error.code === "FORBIDDEN";
    content = (
      <ErrorState
        title={
          forbidden ? d.errorsForbidden : localizedApiError(d, definitions.error, definitions.retryAfterSeconds)
        }
        retry={forbidden ? undefined : <RetryButton label={d.retryLabel} />}
      />
    );
  } else {
    const permissions = session.ok ? session.data.permissions : [];
    content = (
      <CustomFieldsManager
        locale={localeValue}
        initialDefinitions={definitions.data}
        initialPicklists={picklists.ok ? picklists.data : []}
        canManageFields={permissions.includes("settings.custom_fields.manage")}
        canManagePicklists={permissions.includes("settings.picklists.manage")}
      />
    );
  }

  return (
    <AppShell locale={localeValue} pagePath="settings/custom-fields" title={d.cfTitle}>
      {content}
    </AppShell>
  );
}
