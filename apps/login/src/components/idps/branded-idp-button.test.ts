import { describe, expect, test } from "vitest";

import { getBrandedIdpButton } from "./branded-idp-button";
import { SignInWithClaveUnica } from "./sign-in-with-clave-unica";
import { SignInWithGoogleBranded } from "./sign-in-with-google-branded";

describe("getBrandedIdpButton", () => {
  test.each(["google", " Google ", "GOOGLE"])("maps %j to the Google branded button", (name) => {
    expect(getBrandedIdpButton(name)).toBe(SignInWithGoogleBranded);
  });

  test.each(["clave-unica", "Clave-Unica", " CLAVE-UNICA "])("maps %j to the ClaveÚnica button", (name) => {
    expect(getBrandedIdpButton(name)).toBe(SignInWithClaveUnica);
  });

  test.each(["github", "", "   ", undefined, "googlex", "clave unica", "claveunica", "my google"])(
    "returns undefined for %j",
    (name) => {
      expect(getBrandedIdpButton(name)).toBeUndefined();
    },
  );
});
