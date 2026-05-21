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
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-white/10 bg-black/25 p-4 backdrop-blur-xl lg:block">
        <Link href="/" className="mb-8 flex items-center gap-3 px-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-300 text-sm font-black text-black">
            NX
          </span>
          <span>
            <span className="block font-display text-xl font-semibold">NexTrack</span>
            <span className="block text-xs text-zinc-500">media command center</span>
          </span>
        </Link>
        <SidebarNav />
      </aside>
      <div className="lg:pl-64 pb-20 lg:pb-0">
        <header className="sticky top-0 z-30 border-b border-white/10 bg-[#080b12]/85 px-4 py-3 backdrop-blur-xl md:px-8">
          <div className="flex items-center gap-3">
            <Link href="/" className="font-display text-lg font-semibold lg:hidden">
              NexTrack
            </Link>
            <div className="ml-auto flex flex-1 items-center justify-end gap-3">
              <HeaderSearch />
              <Button href="/discover" variant="ghost">
                <Clapperboard className="h-4 w-4" />
                Discover
              </Button>
              {!session?.user ? <Button href="/login">Sign in</Button> : null}
            </div>
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}
