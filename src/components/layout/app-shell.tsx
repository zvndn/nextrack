import Link from "next/link";
import { Clapperboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { HeaderSearch } from "@/components/layout/header-search";
import { AppearanceController } from "@/components/settings/appearance-controller";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { MobileNav } from "@/components/layout/mobile-nav";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <div className="min-h-screen bg-transparent text-zinc-100">
      <AppearanceController />
      <MobileNav />
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-white/10 bg-black/30 p-4 shadow-[20px_0_70px_rgba(0,0,0,0.24)] backdrop-blur-2xl lg:block">
        <Link href="/" className="mb-7 flex items-center gap-3 rounded-lg px-2 py-2 transition hover:bg-white/5">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-300 text-sm font-black text-black shadow-[0_14px_34px_rgb(var(--accent-rgb)/0.2)]">
            NX
          </span>
          <span>
            <span className="block font-display text-xl font-semibold">NexTrack</span>
            <span className="block text-xs text-zinc-500">personal watch tracker</span>
          </span>
        </Link>
        <SidebarNav />
      </aside>
      <div className="pb-20 lg:pl-64 lg:pb-0">
        <header className="app-header sticky top-0 z-30 border-b px-4 py-3 backdrop-blur-2xl md:px-8">
          <div className="mx-auto flex max-w-[1600px] items-center gap-3">
            <Link href="/" className="flex items-center gap-2 font-display text-lg font-semibold lg:hidden">
              <span className="grid h-8 w-8 place-items-center rounded-md bg-cyan-300 text-xs font-black text-black">NX</span>
              <span>NexTrack</span>
            </Link>
            <div className="ml-auto flex flex-1 items-center justify-end gap-3">
              <HeaderSearch />
              <Button href="/discover" variant="ghost" className="hidden sm:inline-flex">
                <Clapperboard className="h-4 w-4" />
                Discover
              </Button>
              {!session?.user ? <Button href="/login">Sign in</Button> : null}
            </div>
          </div>
        </header>
        <div className="mx-auto max-w-[1600px]">{children}</div>
        <footer className="border-t border-white/10 px-4 py-6 text-sm text-zinc-500 md:px-8">
          <div className="mx-auto flex max-w-[1600px] flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p>NexTrack helps you track anime, movies, and TV series in one place.</p>
            <nav className="flex flex-wrap gap-4">
              <Link href="/about" className="transition hover:text-white">About</Link>
              <Link href="/privacy" className="transition hover:text-white">Privacy</Link>
              <Link href="/terms" className="transition hover:text-white">Terms</Link>
            </nav>
          </div>
        </footer>
      </div>
    </div>
  );
}
