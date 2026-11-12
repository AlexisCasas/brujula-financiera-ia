"use client";

import { useActionState } from "react";
import { signIn, type LoginState } from "@/lib/auth/actions";

const initialState: LoginState = { error: null };

export function LoginForm({ next }: Readonly<{ next: string }>) {
  const [state, formAction, pending] = useActionState(signIn, initialState);

  return (
    <form action={formAction} className="login-form">
      <input type="hidden" name="next" value={next} />
      <label htmlFor="email">Correo electrónico</label>
      <input id="email" name="email" type="email" autoComplete="username" required />
      <label htmlFor="password">Contraseña</label>
      <input id="password" name="password" type="password" autoComplete="current-password" required />
      {state.error ? (
        <p role="alert" className="form-error">
          {state.error}
        </p>
      ) : null}
      <button type="submit" disabled={pending} className="primary-button">
        {pending ? "Ingresando…" : "Ingresar"}
      </button>
    </form>
  );
}
