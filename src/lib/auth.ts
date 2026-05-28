import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/types";

const roleLandingPath: Record<UserRole, string> = {
  admin: "/",
  vendedor_fisico: "/ventas",
  vendedor_domicilio: "/ventas-domicilio",
};

export async function requireRole(allowed: UserRole[]) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role as UserRole | undefined;
  if (!role) redirect("/login");

  if (!allowed.includes(role)) {
    redirect(roleLandingPath[role]);
  }

  return role;
}
