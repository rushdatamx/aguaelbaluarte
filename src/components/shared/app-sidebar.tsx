"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { ChevronRight, Menu, LogOut } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/auth-provider";
import type { LucideIcon } from "lucide-react";

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  description: string;
  adminOnly?: boolean;
}

interface AppSidebarProps {
  navigation: NavItem[];
}

function SidebarContent({
  navigation,
  pathname,
  userName,
  userRole,
  onNavClick,
  onLogout,
}: {
  navigation: NavItem[];
  pathname: string;
  userName: string;
  userRole: string;
  onNavClick?: () => void;
  onLogout: () => void;
}) {
  const visibleNav = navigation.filter(
    (item) => !item.adminOnly || userRole === "admin"
  );

  return (
    <>
      {/* Logo */}
      <div className="h-14 flex items-center px-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Image
            src="/images/rushdata-logo.png"
            alt="RushData"
            width={28}
            height={28}
            className="object-contain"
          />
          <span className="font-semibold text-sm">RushData</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1">
        {visibleNav.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onNavClick}
              className={cn(
                "flex items-center gap-2 px-3 py-2.5 md:py-2 rounded-md text-sm transition-colors group",
                isActive
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span className="flex-1 truncate">{item.name}</span>
              {isActive && (
                <ChevronRight className="h-3 w-3 opacity-50" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border space-y-3">
        <div className="text-xs text-muted-foreground">
          <p className="font-medium text-foreground">PURIFICADORA EL BALUARTE</p>
          <p>{userName}</p>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors w-full"
        >
          <LogOut className="h-3.5 w-3.5" />
          Cerrar sesion
        </button>
      </div>
    </>
  );
}

export function AppSidebar({ navigation }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { nombre, role } = useAuth();

  // Close sheet on navigation
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  // Find current page name for mobile header
  const visibleNav = navigation.filter(
    (item) => !item.adminOnly || role === "admin"
  );
  const currentPage = visibleNav.find((item) => item.href === pathname);

  return (
    <>
      {/* Mobile header */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 h-14 flex items-center justify-between px-4 bg-background/80 backdrop-blur-xl border-b border-border">
        <button
          onClick={() => setOpen(true)}
          className="h-10 w-10 flex items-center justify-center rounded-md hover:bg-accent transition-colors"
          aria-label="Abrir menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <span className="text-sm font-semibold">{currentPage?.name ?? "Purificadora El Baluarte"}</span>
        <div className="w-10" />
      </header>

      {/* Mobile sheet */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-60 p-0 flex flex-col [&>button]:hidden">
          <SheetTitle className="sr-only">Menu de navegacion</SheetTitle>
          <SidebarContent
            navigation={navigation}
            pathname={pathname}
            userName={nombre}
            userRole={role}
            onNavClick={() => setOpen(false)}
            onLogout={handleLogout}
          />
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 border-r border-border/50 bg-sidebar backdrop-blur-xl flex-col">
        <SidebarContent
          navigation={navigation}
          pathname={pathname}
          userName={nombre}
          userRole={role}
          onLogout={handleLogout}
        />
      </aside>
    </>
  );
}
