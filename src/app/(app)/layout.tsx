import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppSidebar } from "@/components/shared/app-sidebar";
import { AuthProvider } from "@/components/providers/auth-provider";
import type { UserProfile } from "@/lib/types";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("id, nombre, role, activo")
    .eq("id", user.id)
    .single();

  if (!profile || !profile.activo) {
    await supabase.auth.signOut();
    redirect("/login");
  }

  const userProfile: UserProfile = {
    id: profile.id,
    nombre: profile.nombre,
    role: profile.role as "admin" | "vendedor",
    activo: profile.activo,
  };

  return (
    <AuthProvider profile={userProfile}>
      <div className="flex h-screen bg-background">
        <AppSidebar />
        <main className="flex-1 overflow-auto pt-14 md:pt-0">{children}</main>
      </div>
    </AuthProvider>
  );
}
