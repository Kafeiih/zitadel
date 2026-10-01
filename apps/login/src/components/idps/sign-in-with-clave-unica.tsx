"use client";

import { clsx } from "clsx";
import { forwardRef } from "react";
import { BaseButton, SignInWithIdentityProviderProps } from "./base-button";

// Follows https://wikiguias.digital.gob.cl/Manuales/Bot%C3%B3nCU.
// The important modifiers override the theme defaults of BaseButton, whose classes are not merged.
const claveUnicaClasses = clsx(
  "h-[50px] px-[14px]! py-2 text-base font-bold",
  "border-transparent! bg-[#0F69C4]! text-white!",
  "hover:border-transparent! hover:bg-[#0B4E91]! active:bg-[#07305A]!",
  "focus:border-transparent! focus-visible:bg-[#0B4E91]! focus-visible:outline-4 focus-visible:outline-offset-0 focus-visible:outline-[#FFBE5C]!",
  // Same official colors in dark mode, so the brand looks identical in both themes.
  "dark:border-transparent! dark:bg-[#0F69C4]! dark:text-white!",
  "dark:hover:border-transparent! dark:hover:bg-[#0B4E91]! dark:active:bg-[#07305A]!",
  "dark:focus:border-transparent! dark:focus-visible:bg-[#0B4E91]! dark:focus-visible:outline-[#FFBE5C]!",
);

export const SignInWithClaveUnica = forwardRef<HTMLButtonElement, SignInWithIdentityProviderProps>(
  function SignInWithClaveUnica(props, ref) {
    // The IdP name is intentionally ignored: the brand guidelines require the official wording.
    const { children, name: _name, className, e2e = "clave-unica", "aria-label": ariaLabel, ...restProps } = props;

    return (
      <BaseButton
        {...restProps}
        e2e={e2e}
        aria-label={ariaLabel ?? "Continuar con ClaveÚnica"}
        ref={ref}
        className={clsx(claveUnicaClasses, className)}
      >
        <div className="flex flex-1 items-center justify-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6 shrink-0">
            <path
              fill="#fff"
              fillRule="evenodd"
              d="M11.47,14a.65.65,0,0,1-.21-.54.64.64,0,0,1,.29-.5.68.68,0,0,1,.53-.19.73.73,0,0,1,.49.27.75.75,0,0,1-.08,1,.7.7,0,0,1-.53.19.71.71,0,0,1-.49-.27Zm3.8-8.66A9,9,0,0,1,21,13.57a9,9,0,0,1-18,0A8.78,8.78,0,0,1,8.45,5.32c.37-.09.64-.09.82.36a.76.76,0,0,1-.36,1,7.52,7.52,0,1,0,5.82-.09.66.66,0,0,1-.4-.37.64.64,0,0,1,0-.54.62.62,0,0,1,.37-.39A.64.64,0,0,1,15.27,5.32Zm-7.77,8a4.64,4.64,0,0,1,3.75-4.59V2.33A.91.91,0,0,1,12,1.5h3.31a.75.75,0,0,1,.7.75.78.78,0,0,1-.7.75H12.75V8.76a4.5,4.5,0,0,1,3.75,4.58A4.61,4.61,0,0,1,12,18,4.61,4.61,0,0,1,7.5,13.33Zm7.5.09a3.1,3.1,0,0,0-3-3.12,3.12,3.12,0,0,0,0,6.2A3.09,3.09,0,0,0,15,13.42Z"
            />
          </svg>
          {children ?? <span aria-hidden="true">ClaveÚnica</span>}
        </div>
      </BaseButton>
    );
  },
);
