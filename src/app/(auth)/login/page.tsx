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
    <main className="login-page">
      <div className="panel login-card">
        <p className="brand">
          <span className="mark" aria-hidden="true">
            ◈
          </span>
          <span>
            Brújula <span className="brand-accent">IA</span>
          </span>
        </p>
        <p className="eyebrow">Acceso privado</p>
        <h1>Acceso</h1>
        <p>Aplicación privada de un solo usuario. No hay registro de cuentas.</p>
        <Suspense fallback={null}>
          <LoginWithNext searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}
