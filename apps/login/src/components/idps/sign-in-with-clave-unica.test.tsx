import { afterEach, describe, expect, test } from "vitest";

import { cleanup, render, screen } from "@testing-library/react";
import { SignInWithClaveUnica } from "./sign-in-with-clave-unica";

afterEach(cleanup);

describe("<SignInWithClaveUnica />", () => {
  test("shows the visible brand text", () => {
    render(<SignInWithClaveUnica name="clave-unica" />);
    expect(screen.getByText("ClaveÚnica")).toBeInTheDocument();
    expect(screen.queryByText("clave-unica")).not.toBeInTheDocument();
  });

  test("exposes the official accessible name", () => {
    render(<SignInWithClaveUnica />);
    expect(screen.getByRole("button", { name: "Continuar con ClaveÚnica" })).toBeInTheDocument();
  });

  test("lets the caller override the aria-label", () => {
    render(<SignInWithClaveUnica aria-label="Custom" />);
    expect(screen.getByRole("button", { name: "Custom" })).toBeInTheDocument();
  });

  test("renders a decorative icon", () => {
    const { container } = render(<SignInWithClaveUnica />);
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  test("supports a children override", () => {
    render(<SignInWithClaveUnica>Custom label</SignInWithClaveUnica>);
    expect(screen.getByText("Custom label")).toBeInTheDocument();
    expect(screen.queryByText("ClaveÚnica")).not.toBeInTheDocument();
  });

  test("has the clave-unica e2e marker", () => {
    render(<SignInWithClaveUnica />);
    expect(screen.getByRole("button")).toHaveAttribute("e2e", "clave-unica");
  });
});
