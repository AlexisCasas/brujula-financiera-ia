import { findNavItem } from "@/lib/navigation";
import { ScreenPlaceholder } from "@/components/ScreenPlaceholder";

const item = findNavItem("/investigaciones")!;

export const metadata = { title: `${item.label} · Brújula Financiera IA` };

export default function Page() {
  return <ScreenPlaceholder item={item} />;
}
