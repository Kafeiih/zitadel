import { ForwardRefExoticComponent, RefAttributes } from "react";
import { SignInWithIdentityProviderProps } from "./base-button";
import { SignInWithClaveUnica } from "./sign-in-with-clave-unica";
import { SignInWithGoogleBranded } from "./sign-in-with-google-branded";

type BrandedIdpButton = ForwardRefExoticComponent<SignInWithIdentityProviderProps & RefAttributes<HTMLButtonElement>>;

/**
 * Returns a brand-styled button when the IdP name (trimmed, case-insensitive) matches a known brand.
 * Visual only: the IdP type, form and backend flow are not affected.
 */
export function getBrandedIdpButton(name?: string): BrandedIdpButton | undefined {
  switch (name?.trim().toLowerCase()) {
    case "google":
      return SignInWithGoogleBranded;
    case "clave-unica":
      return SignInWithClaveUnica;
    default:
      return undefined;
  }
}
