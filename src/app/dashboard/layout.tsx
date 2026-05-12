import { ReactNode } from "react";
import { requireAdminSession } from "@/lib/auth";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  await requireAdminSession();
  return <>{children}</>;
}
