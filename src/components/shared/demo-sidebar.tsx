"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";
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

export function DemoSidebar({ navigation, title, subtitle }: DemoSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="w-60 border-r border-border/50 bg-sidebar backdrop-blur-xl flex flex-col">
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
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors group",
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
    </aside>
  );
}
