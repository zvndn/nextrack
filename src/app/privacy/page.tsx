import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How NexTrack stores and uses account and activity data."
};

export default function PrivacyPage() {
  return (
    <AppShell>
      <main className="mx-auto max-w-4xl px-4 py-6 md:px-8">
        <section className="rounded-xl border border-white/10 bg-white/[0.04] p-6 md:p-8">
          <h1 className="font-display text-4xl font-semibold">Privacy Policy</h1>
          <p className="mt-4 text-sm leading-7 text-zinc-300">
            NexTrack stores the minimum account and tracking data needed to operate your library, progress history, favorites,
            reviews, and profile settings.
          </p>
          <div className="mt-6 grid gap-5 text-sm leading-7 text-zinc-400">
            <div>
              <h2 className="font-display text-xl font-semibold text-white">Data we store</h2>
              <p>Account credentials, profile details, watchlist items, progress, favorites, reviews, and local appearance preferences.</p>
            </div>
            <div>
              <h2 className="font-display text-xl font-semibold text-white">How data is used</h2>
              <p>Data is used to authenticate your account, personalize the interface, and keep your media tracking features working.</p>
            </div>
            <div>
              <h2 className="font-display text-xl font-semibold text-white">Third-party sources</h2>
              <p>Search and catalog metadata may come from external providers such as Jikan, TVMaze, and Wikipedia.</p>
            </div>
            <div>
              <h2 className="font-display text-xl font-semibold text-white">Contact and updates</h2>
              <p>Update this page whenever your deployment, analytics, providers, or retention policy changes.</p>
            </div>
          </div>
        </section>
      </main>
    </AppShell>
  );
}
