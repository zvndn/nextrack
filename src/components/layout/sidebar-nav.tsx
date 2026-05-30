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
            className={`group flex h-11 items-center gap-3 rounded-md px-3 text-sm transition-all duration-150 ${
              isActive
                ? "border border-cyan-300/25 bg-cyan-300/12 font-semibold text-cyan-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                : "text-zinc-400 hover:bg-white/7 hover:text-white"
            }`}
          >
            <span className={`grid h-7 w-7 place-items-center rounded-md transition ${isActive ? "bg-cyan-300 text-black" : "bg-white/5 text-zinc-300 group-hover:bg-white/10 group-hover:text-white"}`}>
              <item.icon className="h-4 w-4" />
            </span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
