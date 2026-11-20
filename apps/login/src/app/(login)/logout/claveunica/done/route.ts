import {
  clearedClaveUnicaLogoutCookie,
  getClaveUnicaLogoutCookieName,
  resolveClaveUnicaLogoutDestination,
} from "@/lib/server/claveunica-logout";
import { getPublicHostWithProtocol } from "@/lib/server/host";
import { NextRequest, NextResponse } from "next/server";

// ClaveÚnica returns here after ending its session. The destination comes only from the cookie set before
// leaving for ClaveÚnica; query parameters are ignored so this route cannot be used as an open redirect.
export async function GET(request: NextRequest) {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const loginOrigin = `${getPublicHostWithProtocol(request.headers)}${basePath}`;

  const stored = request.cookies.get(getClaveUnicaLogoutCookieName())?.value;
  const response = NextResponse.redirect(resolveClaveUnicaLogoutDestination(stored, loginOrigin));
  response.cookies.set(clearedClaveUnicaLogoutCookie());

  return response;
}
