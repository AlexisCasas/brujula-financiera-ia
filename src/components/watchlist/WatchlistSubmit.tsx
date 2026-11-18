"use client";

import { useFormStatus } from "react-dom";

export function WatchlistSubmit({
  label, variant = "primary",
}: Readonly<{ label: string; variant?: "primary" | "secondary" }>) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={variant === "primary" ? "primary-button" : "watchlist-secondary-button"}
      aria-busy={pending}
    >
      {pending ? "Guardando…" : label}
    </button>
  );
}
