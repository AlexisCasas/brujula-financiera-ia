import { Academy } from "@/components/beginner/Academy";
import { findNavItem } from "@/lib/navigation";
const item=findNavItem("/academia")!;
export const metadata={title:`${item.label} · Brújula Financiera IA`};
export default function AcademyPage(){return <Academy/>;}
