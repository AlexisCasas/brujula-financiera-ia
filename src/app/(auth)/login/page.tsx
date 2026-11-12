import { Suspense } from "react";
import { safeNextPath } from "@/lib/auth/access";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Acceso · Brújula Financiera IA" };

async function LoginWithNext({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return <LoginForm next={safeNextPath(next)} />;
}

export default function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  return (
    <main className="login">
      <h1>Acceso</h1>
      <p>Aplicación privada de un solo usuario. No hay registro de cuentas.</p>
      <Suspense fallback={null}>
        <LoginWithNext searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
