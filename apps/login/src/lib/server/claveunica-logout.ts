import "server-only";

import { isSafeRedirectUri } from "@/lib/client-utils";
import { createLogger } from "@/lib/server/logger";
import { ServiceConfig } from "@/lib/server/zitadel";
import { verifyJwt } from "@zitadel/client/node";
import { cookies } from "next/headers";

// ClaveÚnica requires relying parties to end its SSO session whenever they end their own. ZITADEL only
// supports federated logout for SAML IdPs, so the login sends the browser through the ClaveÚnica logout
// endpoint after the ZITADEL session is gone, and continues to the final destination from here.

const COOKIE_BASE_NAME = "claveunica_logout_destination";

function isSecureCookie(): boolean {
  return process.env.NODE_ENV === "production";
}

/**
 * The destination cookie name. In production it carries the `__Host-` prefix, so browsers only accept it
 * when this host set it (Secure, Path=/, no Domain): a sibling subdomain cannot plant a destination. Browsers
 * reject `__Host-` cookies without Secure, so development over plain http uses the bare name.
 */
export function getClaveUnicaLogoutCookieName(): string {
  return isSecureCookie() ? `__Host-${COOKIE_BASE_NAME}` : COOKIE_BASE_NAME;
}

// Attributes shared by setting and deleting the cookie: a deletion of a `__Host-` cookie without Secure is
// ignored by browsers.
function cookieAttributes() {
  return {
    name: getClaveUnicaLogoutCookieName(),
    httpOnly: true,
    path: "/",
    // lax: the cookie must come back on the top-level navigation from ClaveÚnica to the return route
    sameSite: "lax" as const,
    secure: isSecureCookie(),
  };
}

export function clearedClaveUnicaLogoutCookie() {
  return { ...cookieAttributes(), value: "", maxAge: 0 };
}

// The single URL registered as Logout URI at ClaveÚnica, relative to the login base path.
export const CLAVEUNICA_LOGOUT_RETURN_PATH = "/logout/claveunica/done";

export const LOGOUT_DONE_PATH = "/logout/done";

const logger = createLogger("claveunica-logout");

const DESTINATION_MAX_AGE_SECONDS = 5 * 60;

export function getClaveUnicaLogoutUrl(): string | undefined {
  return process.env.CLAVEUNICA_LOGOUT_URL?.trim() || undefined;
}

export function buildClaveUnicaLogoutRedirect(logoutUrl: string, returnUrl: string): string {
  return `${logoutUrl}?redirect=${encodeURIComponent(returnUrl)}`;
}

export function logoutDonePath(organization?: string): string {
  const params = new URLSearchParams();
  if (organization) {
    params.set("organization", organization);
  }
  const query = params.toString();
  return query ? `${LOGOUT_DONE_PATH}?${query}` : LOGOUT_DONE_PATH;
}

/**
 * Returns the post_logout_redirect_uri of a logout token issued by ZITADEL, or undefined when there is no
 * token, it fails verification, or it carries no redirect. The token is verified against the instance keys,
 * so only redirect URIs ZITADEL already validated for the application are returned.
 */
export async function getVerifiedPostLogoutRedirectUri(
  logoutToken: string | undefined,
  serviceConfig: ServiceConfig,
): Promise<string | undefined> {
  if (!logoutToken) {
    return undefined;
  }

  try {
    const payload = await verifyJwt<{ post_logout_redirect_uri?: string }>(
      logoutToken,
      `${serviceConfig.baseUrl}/oauth/v2/keys`,
      {
        instanceHost: serviceConfig.instanceHost,
        publicHost: serviceConfig.publicHost,
      },
    );
    return typeof payload.post_logout_redirect_uri === "string" && payload.post_logout_redirect_uri
      ? payload.post_logout_redirect_uri
      : undefined;
  } catch (error) {
    logger.warn("Failed to verify the logout token, using /logout/done as destination", { error });
    return undefined;
  }
}

export async function setClaveUnicaLogoutDestination(destination: string): Promise<void> {
  const cookiesList = await cookies();
  cookiesList.set({ ...cookieAttributes(), value: destination, maxAge: DESTINATION_MAX_AGE_SECONDS });
}

/**
 * Resolves the stored destination to an absolute URL. `loginOrigin` is the public origin of the login
 * including its base path. Paths stay inside the login; anything unusable falls back to /logout/done.
 */
export function resolveClaveUnicaLogoutDestination(stored: string | undefined, loginOrigin: string): string {
  const fallback = `${loginOrigin}${LOGOUT_DONE_PATH}`;

  if (!stored) {
    return fallback;
  }

  if (stored.startsWith("/")) {
    // "//host" and "/\host" are protocol-relative for browsers and would leave the login
    if (stored.startsWith("//") || stored.startsWith("/\\")) {
      return fallback;
    }
    return `${loginOrigin}${stored}`;
  }

  try {
    return isSafeRedirectUri(stored) ? new URL(stored).toString() : fallback;
  } catch {
    return fallback;
  }
}
