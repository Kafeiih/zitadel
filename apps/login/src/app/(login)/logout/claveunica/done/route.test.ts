import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { GET } from "./route";

const ORIGIN = "https://auth.example.cl/ui/v2/login";

function request(path: string, destinationCookie?: string, cookieName = "claveunica_logout_destination") {
  const req = new NextRequest(`http://internal:3000/ui/v2/login${path}`, {
    headers: { host: "auth.example.cl" },
  });
  if (destinationCookie !== undefined) {
    req.cookies.set(cookieName, destinationCookie);
  }
  return req;
}

describe("GET /logout/claveunica/done", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_BASE_PATH", "/ui/v2/login");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test("redirects to the post_logout_redirect_uri stored in the cookie and deletes the cookie", async () => {
    const response = await GET(request("/logout/claveunica/done", "https://app.example.cl/bye"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://app.example.cl/bye");
    expect(response.headers.get("set-cookie")).toBe(
      "claveunica_logout_destination=; Path=/; Max-Age=0; HttpOnly; SameSite=lax",
    );
  });

  test("in production reads the __Host- cookie and deletes it with Secure", async () => {
    vi.stubEnv("NODE_ENV", "production");

    const response = await GET(
      request("/logout/claveunica/done", "https://app.example.cl/bye", "__Host-claveunica_logout_destination"),
    );

    expect(response.headers.get("location")).toBe("https://app.example.cl/bye");
    expect(response.headers.get("set-cookie")).toBe(
      "__Host-claveunica_logout_destination=; Path=/; Max-Age=0; Secure; HttpOnly; SameSite=lax",
    );
  });

  test("in production ignores a cookie without the __Host- prefix", async () => {
    vi.stubEnv("NODE_ENV", "production");

    const response = await GET(request("/logout/claveunica/done", "https://evil.example"));

    expect(response.headers.get("location")).toBe(`${ORIGIN}/logout/done`);
  });

  test("redirects to the stored login path under the base path", async () => {
    const response = await GET(request("/logout/claveunica/done", "/logout/done?organization=org-1"));

    expect(response.headers.get("location")).toBe(`${ORIGIN}/logout/done?organization=org-1`);
  });

  test("redirects to /logout/done without a cookie and ignores URLs in the query", async () => {
    const response = await GET(
      request("/logout/claveunica/done?next=https://evil.example&redirect=https://evil.example&url=//evil.example"),
    );

    expect(response.headers.get("location")).toBe(`${ORIGIN}/logout/done`);
  });

  test.each(["//evil.example/path", "/\\evil.example", "javascript:alert(1)", "not a url"])(
    "redirects to /logout/done for an unusable cookie value %s",
    async (value) => {
      const response = await GET(request("/logout/claveunica/done", value));

      expect(response.headers.get("location")).toBe(`${ORIGIN}/logout/done`);
    },
  );
});
