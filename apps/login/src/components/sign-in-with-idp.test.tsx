import { cleanup, render, screen } from "@testing-library/react";
import { create } from "@zitadel/client";
import { IdentityProviderSchema, IdentityProviderType } from "@zitadel/proto/zitadel/settings/v2/login_settings_pb";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, test, vi } from "vitest";
import { SignInWithIdp } from "./sign-in-with-idp";

vi.mock("@/lib/server/idp", () => ({
  redirectToIdp: vi.fn(),
}));

const messages = { idp: { signInWithGoogle: "Sign in with Google", signInWith: "or sign in with" } };

function renderIdp(name: string, type: IdentityProviderType) {
  const idp = create(IdentityProviderSchema, { id: `${name}-id`, name, type });
  const { container } = render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <SignInWithIdp identityProviders={[idp]} requestId="req-1" organization="org-1" showLabel={false} />
    </NextIntlClientProvider>,
  );
  const hidden = (field: string) =>
    container.querySelector<HTMLInputElement>(`input[type="hidden"][name="${field}"]`)?.value;
  return { container, hidden };
}

describe("<SignInWithIdp />", () => {
  afterEach(cleanup);

  test("renders the ClaveÚnica button for an OIDC IdP named clave-unica and keeps the form payload", () => {
    const { hidden } = renderIdp("clave-unica", IdentityProviderType.OIDC);

    expect(screen.getByRole("button", { name: "Continuar con ClaveÚnica" })).toBeInTheDocument();
    expect(hidden("id")).toBe("clave-unica-id");
    expect(hidden("provider")).toBe("oidc");
    expect(hidden("requestId")).toBe("req-1");
    expect(hidden("organization")).toBe("org-1");
  });

  test("renders the Google branded button for an OIDC IdP named Google", () => {
    const { hidden } = renderIdp("Google", IdentityProviderType.OIDC);

    expect(screen.getByRole("button", { name: /Sign in with Google/ })).toBeInTheDocument();
    expect(screen.queryByText("Google", { exact: true })).not.toBeInTheDocument();
    expect(hidden("provider")).toBe("oidc");
  });

  test("keeps the generic button for other IdP names", () => {
    renderIdp("Corporate SSO", IdentityProviderType.OIDC);

    expect(screen.getByRole("button", { name: "Corporate SSO" })).toBeInTheDocument();
  });
});
