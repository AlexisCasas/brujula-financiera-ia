import { NAV_ITEMS } from "@/lib/navigation";
import { ScreenPlaceholder } from "@/components/ScreenPlaceholder";

const item = NAV_ITEMS.find((i) => i.href === "/comparador")!;

export const metadata = { title: `${item.label} · Brújula Financiera IA` };

export default function Page() {
  return <ScreenPlaceholder title={item.label} description={item.description} />;
}
