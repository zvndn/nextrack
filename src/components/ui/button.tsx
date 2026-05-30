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
    "inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]";
  const styles =
    variant === "primary"
      ? "bg-cyan-300 text-slate-950 shadow-[0_12px_34px_rgb(var(--accent-rgb)/0.2)] hover:bg-cyan-200 hover:shadow-[0_16px_44px_rgb(var(--accent-rgb)/0.26)]"
      : "border border-white/10 bg-white/5 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] hover:border-white/20 hover:bg-white/10";

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
