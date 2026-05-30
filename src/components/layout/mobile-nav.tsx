"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems } from "@/components/layout/nav-items";

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex h-[4.75rem] border-t border-white/10 bg-[#080b12]/88 px-1 pb-2 pt-1 shadow-[0_-18px_50px_rgba(0,0,0,0.24)] backdrop-blur-2xl lg:hidden">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-1 flex-col items-center justify-center gap-1 rounded-md transition-all duration-200 active:scale-95 ${
              isActive
                ? "bg-cyan-300/10 text-cyan-200"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <item.icon className="h-5 w-5" />
            <span className="text-[10px] font-semibold tracking-wide">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
