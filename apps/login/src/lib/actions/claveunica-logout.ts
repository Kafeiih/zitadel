"use server";

import {
  buildClaveUnicaLogoutRedirect,
  CLAVEUNICA_LOGOUT_RETURN_PATH,
  getClaveUnicaLogoutUrl,
  getVerifiedPostLogoutRedirectUri,
  logoutDonePath,
  setClaveUnicaLogoutDestination,
} from "@/lib/server/claveunica-logout";
import { getPublicHostWithProtocol } from "@/lib/server/host";
import { getServiceConfig } from "@/lib/server/service-url";
import { headers } from "next/headers";

export type StartClaveUnicaLogoutCommand = {
  // The signed logout token ZITADEL passed to the logout page. The destination is taken from it after
  // verification, never from a URL sent by the browser.
  logoutToken?: string;
  organization?: string;
};

/**
 * Prepares ending the ClaveÚnica SSO session after the ZITADEL session was cleared: stores the final
 * destination in a short-lived httpOnly cookie and returns the ClaveÚnica logout URL to navigate to.
 * Returns undefined when CLAVEUNICA_LOGOUT_URL is not configured.
 */
export async function startClaveUnicaLogout(
  command: StartClaveUnicaLogoutCommand,
): Promise<{ redirect: string } | undefined> {
  const logoutUrl = getClaveUnicaLogoutUrl();
  if (!logoutUrl) {
    return undefined;
  }

  const _headers = await headers();
  const { serviceConfig } = getServiceConfig(_headers);

  const destination =
    (await getVerifiedPostLogoutRedirectUri(command.logoutToken, serviceConfig)) ?? logoutDonePath(command.organization);

  await setClaveUnicaLogoutDestination(destination);

  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const returnUrl = `${getPublicHostWithProtocol(_headers)}${basePath}${CLAVEUNICA_LOGOUT_RETURN_PATH}`;

  return { redirect: buildClaveUnicaLogoutRedirect(logoutUrl, returnUrl) };
}
