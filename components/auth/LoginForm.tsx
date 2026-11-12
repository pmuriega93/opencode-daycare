"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { signIn } from "@/lib/auth-actions";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { IconBox } from "@/components/ui/IconBox";
import { IconSun } from "@/components/ui/Icons";
import type { LoginState } from "@/lib/types/auth";

type LoginFormProps = {
  defaultEmail: string;
  nextPath: string | null;
};

const initialState: LoginState = { error: null };

export function LoginForm({ defaultEmail, nextPath }: LoginFormProps) {
  const [state, formAction, pending] = useActionState(signIn, initialState);
  const [email, setEmail] = useState(defaultEmail);

  return (
    <form action={formAction} className="w-full max-w-[392px]">
      <div className="mb-8 flex items-center justify-center gap-[11px] lg:hidden">
        <IconBox bg="linear-gradient(135deg,#F8C3A8,#F2937A)" color="#fff" size={38}>
          <IconSun size={21} />
        </IconBox>
        <span className="font-fredoka text-[18px] font-semibold text-text">
          OpenDayCare
        </span>
      </div>

      <h2 className="mb-[6px] font-fredoka text-[30px] font-semibold text-text">
        Iniciar sesión
      </h2>
      <p className="mb-7 text-[15px] text-muted">Ingresá para ver el día de hoy.</p>

      <FormField
        label="EMAIL"
        name="email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={setEmail}
        inputClassName="mb-[18px]"
      />
      <FormField
        label="CONTRASEÑA"
        name="password"
        type="password"
        autoComplete="current-password"
        placeholder="••••••••"
        inputClassName="mb-[10px]"
      />
      <input type="hidden" name="next" value={nextPath ?? ""} />

      {state.error ? (
        <div
          role="alert"
          className="mb-4 rounded-[12px] bg-peach px-4 py-3 text-[13.5px] font-bold text-accent-2"
        >
          {state.error}
        </div>
      ) : null}

      <div className="mb-5 text-right">
        <span className="cursor-pointer text-[13.5px] font-bold text-accent-2">
          ¿Olvidaste tu contraseña?
        </span>
      </div>

      <Button
        type="submit"
        disabled={pending}
        className="w-full p-[15px]! rounded-[15px]! text-[16px]! shadow-[0_10px_22px_-8px_rgba(238,129,100,.7)]!"
      >
        {pending ? "Ingresando…" : "Iniciar sesión"}
      </Button>

      <p className="mt-6 text-center text-[14.5px] text-muted">
        ¿Te invitó la guardería?{" "}
        <Link href="/activate-account" className="font-extrabold text-accent-2">
          Activá tu cuenta
        </Link>
      </p>
    </form>
  );
}
