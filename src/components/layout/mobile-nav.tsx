"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems } from "@/components/layout/nav-items";

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-16 border-t border-white/10 bg-[#080b12]/80 backdrop-blur-lg lg:hidden">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-1 flex-col items-center justify-center gap-1 transition-all duration-200 active:scale-95 ${
              isActive
                ? "text-cyan-300 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]"
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
