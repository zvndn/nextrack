import Link from "next/link";
import { cn } from "@/lib/utils";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

type Props = ComponentPropsWithoutRef<"button"> & {
  href?: string;
  variant?: "primary" | "ghost";
  children: ReactNode;
};

export function Button({ className, variant = "primary", href, children, ...props }: Props) {
  const base =
    "inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 disabled:pointer-events-none disabled:opacity-50";
  const styles =
    variant === "primary"
      ? "bg-cyan-300 text-slate-950 hover:bg-cyan-200 shadow-glow"
      : "bg-white/5 text-white hover:bg-white/10 border border-white/10";

  if (href) {
    return (
      <Link className={cn(base, styles, className)} href={href}>
        {children}
      </Link>
    );
  }

  return (
    <button className={cn(base, styles, className)} {...props}>
      {children}
    </button>
  );
}
