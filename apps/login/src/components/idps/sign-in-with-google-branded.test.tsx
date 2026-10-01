import { afterEach, describe, expect, test } from "vitest";

import { cleanup, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { SignInWithGoogleBranded } from "./sign-in-with-google-branded";

afterEach(cleanup);

const messages = { idp: { signInWithGoogle: "Sign in with Google" } };

function renderButton(ui: React.ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {ui}
    </NextIntlClientProvider>,
  );
}

describe("<SignInWithGoogleBranded />", () => {
  test("renders the translated label and not the raw IdP name", () => {
    renderButton(<SignInWithGoogleBranded name="google" />);
    expect(screen.getByText("Sign in with Google")).toBeInTheDocument();
    expect(screen.queryByText("google")).not.toBeInTheDocument();
  });

  test("renders a decorative logo svg", () => {
    const { container } = renderButton(<SignInWithGoogleBranded />);
    const svg = container.querySelector("svg");
    expect(svg).not.toBeNull();
    expect(svg).toHaveAttribute("aria-hidden", "true");
  });

  test("supports a children override", () => {
    renderButton(<SignInWithGoogleBranded>Custom label</SignInWithGoogleBranded>);
    expect(screen.getByText("Custom label")).toBeInTheDocument();
    expect(screen.queryByText("Sign in with Google")).not.toBeInTheDocument();
  });

  test("is a submit button with the google e2e marker", () => {
    renderButton(<SignInWithGoogleBranded />);
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("type", "submit");
    expect(button).toHaveAttribute("e2e", "google");
  });
});
