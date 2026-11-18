import Link from "next/link";
import { GoalForm } from "@/components/beginner/GoalForm";
import { findNavItem } from "@/lib/navigation";

const item = findNavItem("/objetivo")!;
export const metadata = { title: `${item.label} · Brújula Financiera IA` };

export default function GoalPage() {
  return (
    <section aria-labelledby="screen-title">
      <header className="intro">
        <p className="eyebrow">{item.eyebrow}</p>
        <h1 id="screen-title">¿Para qué estás invirtiendo?</h1>
        <p>
          Definir un objetivo convierte tu perfil de riesgo en contexto. No necesitas
          saber todavía qué comprar.
        </p>
      </header>
      <GoalForm />
    </section>
  );
}
