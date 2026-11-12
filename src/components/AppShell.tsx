import type { ReactNode } from "react";
import { signOut } from "@/lib/auth/actions";
import { AppFrame } from "./AppFrame";

export function AppShell({ children }: Readonly<{ children: ReactNode }>) {
  return <AppFrame signOutAction={signOut}>{children}</AppFrame>;
}
