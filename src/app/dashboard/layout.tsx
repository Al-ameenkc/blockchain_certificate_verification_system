import { ReactNode } from "react";
import { requireAdminSession } from "@/lib/auth";
import DashboardShell from "@/components/DashboardShell";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  await requireAdminSession();
  return <DashboardShell>{children}</DashboardShell>;
}
