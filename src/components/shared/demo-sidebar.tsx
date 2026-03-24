"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ChevronRight, Menu, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import type { LucideIcon } from "lucide-react";

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  description: string;
}

interface DemoSidebarProps {
  navigation: NavItem[];
  title: string;
  subtitle: string;
}

function SidebarContent({
  navigation,
  title,
  subtitle,
  pathname,
  onNavClick,
}: {
  navigation: NavItem[];
  title: string;
  subtitle: string;
  pathname: string;
  onNavClick?: () => void;
}) {
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
        {navigation.map((item) => {
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
      <div className="p-4 border-t border-border">
        <div className="text-xs text-muted-foreground">
          <p className="font-medium text-foreground">{title}</p>
          <p>{subtitle}</p>
        </div>
      </div>
    </>
  );
}

export function DemoSidebar({ navigation, title, subtitle }: DemoSidebarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close sheet on navigation
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Find current page name for mobile header
  const currentPage = navigation.find((item) => item.href === pathname);

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
        <span className="text-sm font-semibold">{currentPage?.name ?? title}</span>
        <div className="w-10" />
      </header>

      {/* Mobile sheet */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-60 p-0 flex flex-col [&>button]:hidden">
          <SheetTitle className="sr-only">Menu de navegacion</SheetTitle>
          <SidebarContent
            navigation={navigation}
            title={title}
            subtitle={subtitle}
            pathname={pathname}
            onNavClick={() => setOpen(false)}
          />
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 border-r border-border/50 bg-sidebar backdrop-blur-xl flex-col">
        <SidebarContent
          navigation={navigation}
          title={title}
          subtitle={subtitle}
          pathname={pathname}
        />
      </aside>
    </>
  );
}
