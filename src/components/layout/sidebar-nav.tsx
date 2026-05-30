"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems } from "@/components/layout/nav-items";

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex h-10 items-center gap-3 rounded-md px-3 text-sm transition-all duration-150 ${
              isActive
                ? "bg-cyan-300/10 text-cyan-300 border-l-2 border-cyan-300 font-semibold shadow-[inset_4px_0_12px_rgba(34,211,238,0.05)]"
                : "text-zinc-300 hover:bg-white/5 hover:text-white"
            }`}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
