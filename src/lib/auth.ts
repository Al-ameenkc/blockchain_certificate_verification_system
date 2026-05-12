import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function requireAdminSession() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session_v2")?.value;

  if (session !== "authenticated") {
    redirect("/login");
  }
}
