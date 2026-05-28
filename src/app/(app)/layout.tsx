import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppSidebar } from "@/components/shared/app-sidebar";
import { AuthProvider } from "@/components/providers/auth-provider";
import {
  LayoutDashboard,
  Truck,
  ShoppingCart,
  ClipboardList,
  Users,
} from "lucide-react";
import type { UserProfile } from "@/lib/types";

const navigation = [
  {
    name: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
    description: "KPIs e ingresos del dia",
    adminOnly: true,
  },
  {
    name: "Ventas Domicilio",
    href: "/ventas-domicilio",
    icon: Truck,
    description: "Entregas a domicilio",
  },
  {
    name: "Ventas Fisico",
    href: "/ventas",
    icon: ShoppingCart,
    description: "Ventas en punto de venta",
  },
  {
    name: "Ventas",
    href: "/todas-ventas",
    icon: ClipboardList,
    description: "Consulta y filtra ventas",
    adminOnly: true,
  },
  {
    name: "Clientes",
    href: "/clientes",
    icon: Users,
    description: "Base de clientes",
  },
];

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
        <AppSidebar navigation={navigation} />
        <main className="flex-1 overflow-auto pt-14 md:pt-0">{children}</main>
      </div>
    </AuthProvider>
  );
}
