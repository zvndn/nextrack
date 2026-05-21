import Link from "next/link";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";

const nav = [
  { href: "/discover", label: "Discover" }
];

export async function Header() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/45 backdrop-blur-2xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-400/15 text-sm font-semibold text-cyan-200 shadow-glow">
            N
          </span>
          <div>
            <div className="font-display text-lg font-semibold tracking-tight">NexTrack</div>
            <div className="text-[11px] uppercase tracking-[0.24em] text-slate-400">
              media tracker
            </div>
          </div>
        </Link>
        <nav className="hidden gap-6 text-sm text-slate-300 md:flex">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className="transition hover:text-white">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          {!session?.user ? (
            <>
              <Button variant="ghost" href="/login" className="hidden sm:inline-flex">
                Sign in
              </Button>
              <Button href="/register">
                Get started
              </Button>
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
}
