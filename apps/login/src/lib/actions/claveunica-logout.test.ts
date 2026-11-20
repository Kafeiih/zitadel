import { startClaveUnicaLogout } from "@/lib/actions/claveunica-logout";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const cookieSet = vi.fn();

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers({ host: "auth.example.cl" })),
  cookies: vi.fn(async () => ({ set: cookieSet })),
}));

vi.mock("@/lib/server/service-url", () => ({
  getServiceConfig: vi.fn(() => ({
    serviceConfig: { baseUrl: "https://auth.example.cl", instanceHost: "auth.example.cl", publicHost: "auth.example.cl" },
  })),
}));

vi.mock("@zitadel/client/node", () => ({
  verifyJwt: vi.fn(),
}));

const LOGOUT_URL = "https://accounts.claveunica.gob.cl/api/v1/accounts/app/logout";
const EXPECTED_REDIRECT = `${LOGOUT_URL}?redirect=${encodeURIComponent("https://auth.example.cl/ui/v2/login/logout/claveunica/done")}`;

describe("startClaveUnicaLogout", () => {
  let verifyJwt: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.stubEnv("CLAVEUNICA_LOGOUT_URL", LOGOUT_URL);
    vi.stubEnv("NEXT_PUBLIC_BASE_PATH", "/ui/v2/login");
    verifyJwt = vi.mocked((await import("@zitadel/client/node")).verifyJwt);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test("does nothing when CLAVEUNICA_LOGOUT_URL is not set", async () => {
    vi.stubEnv("CLAVEUNICA_LOGOUT_URL", "");

    const result = await startClaveUnicaLogout({ logoutToken: "token", organization: "org-1" });

    expect(result).toBeUndefined();
    expect(cookieSet).not.toHaveBeenCalled();
  });

  test("stores the post_logout_redirect_uri of the verified logout token and returns the ClaveÚnica logout URL", async () => {
    verifyJwt.mockResolvedValue({ post_logout_redirect_uri: "https://app.example.cl/bye" });

    const result = await startClaveUnicaLogout({ logoutToken: "token", organization: "org-1" });

    expect(verifyJwt).toHaveBeenCalledWith("token", "https://auth.example.cl/oauth/v2/keys", {
      instanceHost: "auth.example.cl",
      publicHost: "auth.example.cl",
    });
    expect(cookieSet).toHaveBeenCalledWith({
      name: "claveunica_logout_destination",
      value: "https://app.example.cl/bye",
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      maxAge: 300,
      secure: false,
    });
    expect(result).toEqual({ redirect: EXPECTED_REDIRECT });
  });

  test("uses a Secure __Host- cookie in production so sibling subdomains cannot plant a destination", async () => {
    vi.stubEnv("NODE_ENV", "production");
    verifyJwt.mockResolvedValue({ post_logout_redirect_uri: "https://app.example.cl/bye" });

    await startClaveUnicaLogout({ logoutToken: "token" });

    expect(cookieSet).toHaveBeenCalledWith({
      name: "__Host-claveunica_logout_destination",
      value: "https://app.example.cl/bye",
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      maxAge: 300,
      secure: true,
    });
  });

  test("stores /logout/done with the organization when there is no logout token", async () => {
    const result = await startClaveUnicaLogout({ organization: "org-1" });

    expect(verifyJwt).not.toHaveBeenCalled();
    expect(cookieSet).toHaveBeenCalledWith(expect.objectContaining({ value: "/logout/done?organization=org-1" }));
    expect(result).toEqual({ redirect: EXPECTED_REDIRECT });
  });

  test("stores /logout/done without a query when there is neither a logout token nor an organization", async () => {
    await startClaveUnicaLogout({});

    expect(cookieSet).toHaveBeenCalledWith(expect.objectContaining({ value: "/logout/done" }));
  });

  test("never stores a destination from a logout token that fails verification", async () => {
    verifyJwt.mockRejectedValue(new Error("invalid signature"));

    const result = await startClaveUnicaLogout({ logoutToken: "forged", organization: "org-1" });

    expect(cookieSet).toHaveBeenCalledWith(expect.objectContaining({ value: "/logout/done?organization=org-1" }));
    expect(result).toEqual({ redirect: EXPECTED_REDIRECT });
  });
});
