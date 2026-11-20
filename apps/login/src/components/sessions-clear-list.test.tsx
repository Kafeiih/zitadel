import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { create } from "@zitadel/client";
import { SessionSchema } from "@zitadel/proto/zitadel/session/v2/session_pb";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { SessionsClearList } from "./sessions-clear-list";

const push = vi.fn();
const redirect = vi.fn();
const assign = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  redirect: (url: string) => redirect(url),
}));

vi.mock("@/lib/actions/session", () => ({
  clearSession: vi.fn(),
}));

vi.mock("@/lib/actions/claveunica-logout", () => ({
  startClaveUnicaLogout: vi.fn(),
}));

vi.mock("./session-clear-item", () => ({
  SessionClearItem: ({ session, reload }: { session: { id: string }; reload: () => void }) => (
    <button onClick={reload}>{`clear ${session.id}`}</button>
  ),
}));

const CLAVEUNICA_REDIRECT = "https://accounts.claveunica.gob.cl/api/v1/accounts/app/logout?redirect=x";

const session = create(SessionSchema, { id: "session-1", factors: { user: { loginName: "12345678-5" } } });

function renderList(props: { logoutHint?: string; postLogoutRedirectUri?: string; logoutToken?: string } = {}) {
  return render(
    <NextIntlClientProvider locale="en" messages={{ error: { couldNotClearSession: "Could not clear" }, logout: {} }}>
      <SessionsClearList sessions={[session]} organization="org-1" {...props} />
    </NextIntlClientProvider>,
  );
}

describe("<SessionsClearList /> ClaveÚnica logout", () => {
  let clearSession: any;
  let startClaveUnicaLogout: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal("location", { ...window.location, assign });
    clearSession = vi.mocked((await import("@/lib/actions/session")).clearSession);
    startClaveUnicaLogout = vi.mocked((await import("@/lib/actions/claveunica-logout")).startClaveUnicaLogout);
    clearSession.mockResolvedValue(undefined);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  test("hinted logout clears the ZITADEL session, then navigates to the ClaveÚnica logout", async () => {
    startClaveUnicaLogout.mockResolvedValue({ redirect: CLAVEUNICA_REDIRECT });

    renderList({ logoutHint: "12345678-5", postLogoutRedirectUri: "https://app.example.cl/bye", logoutToken: "token" });

    await waitFor(() => expect(assign).toHaveBeenCalledWith(CLAVEUNICA_REDIRECT));
    expect(clearSession).toHaveBeenCalledWith({ sessionId: "session-1" });
    expect(startClaveUnicaLogout).toHaveBeenCalledWith({ logoutToken: "token", organization: "org-1" });
    expect(clearSession.mock.invocationCallOrder[0]).toBeLessThan(startClaveUnicaLogout.mock.invocationCallOrder[0]);
    expect(redirect).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });

  test("hinted logout keeps the current redirect when the ClaveÚnica logout is not configured", async () => {
    startClaveUnicaLogout.mockResolvedValue(undefined);

    renderList({ logoutHint: "12345678-5", postLogoutRedirectUri: "https://app.example.cl/bye", logoutToken: "token" });

    await waitFor(() => expect(redirect).toHaveBeenCalledWith("https://app.example.cl/bye"));
    expect(assign).not.toHaveBeenCalled();
  });

  test("hinted logout without a post logout redirect still goes to /logout/done when ClaveÚnica is not configured", async () => {
    startClaveUnicaLogout.mockResolvedValue(undefined);

    renderList({ logoutHint: "12345678-5" });

    await waitFor(() => expect(push).toHaveBeenCalledWith("/logout/done?organization=org-1"));
  });

  test("hinted logout falls back to the current redirect when the ClaveÚnica logout fails", async () => {
    startClaveUnicaLogout.mockRejectedValue(new Error("unreachable"));

    renderList({ logoutHint: "12345678-5", postLogoutRedirectUri: "https://app.example.cl/bye", logoutToken: "token" });

    await waitFor(() => expect(redirect).toHaveBeenCalledWith("https://app.example.cl/bye"));
    expect(clearSession).toHaveBeenCalled();
  });

  test("hinted logout does not leave for ClaveÚnica when the ZITADEL session could not be cleared", async () => {
    clearSession.mockResolvedValue({ error: "boom" });

    renderList({ logoutHint: "12345678-5", logoutToken: "token" });

    await screen.findByText("boom");
    expect(startClaveUnicaLogout).not.toHaveBeenCalled();
    expect(assign).not.toHaveBeenCalled();
  });

  test("clearing a session from the list navigates to the ClaveÚnica logout", async () => {
    startClaveUnicaLogout.mockResolvedValue({ redirect: CLAVEUNICA_REDIRECT });

    renderList({ postLogoutRedirectUri: "https://app.example.cl/bye", logoutToken: "token" });
    await act(async () => fireEvent.click(screen.getByText("clear session-1")));

    await waitFor(() => expect(assign).toHaveBeenCalledWith(CLAVEUNICA_REDIRECT));
    expect(startClaveUnicaLogout).toHaveBeenCalledWith({ logoutToken: "token", organization: "org-1" });
    expect(push).not.toHaveBeenCalled();
  });

  test("clearing a session from the list keeps the current redirect when ClaveÚnica is not configured", async () => {
    startClaveUnicaLogout.mockResolvedValue(undefined);

    renderList({ postLogoutRedirectUri: "https://app.example.cl/bye" });
    await act(async () => fireEvent.click(screen.getByText("clear session-1")));

    await waitFor(() => expect(push).toHaveBeenCalledWith("https://app.example.cl/bye"));
    expect(assign).not.toHaveBeenCalled();
  });

  test("clearing a session from the list without a post logout redirect stays on the list when ClaveÚnica is not configured", async () => {
    startClaveUnicaLogout.mockResolvedValue(undefined);

    renderList();
    await act(async () => fireEvent.click(screen.getByText("clear session-1")));

    await waitFor(() => expect(startClaveUnicaLogout).toHaveBeenCalled());
    expect(push).not.toHaveBeenCalled();
    expect(assign).not.toHaveBeenCalled();
  });
});
