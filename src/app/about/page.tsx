import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";

export const metadata: Metadata = {
  title: "About",
  description: "What NexTrack does and who it is for."
};

export default function AboutPage() {
  return (
    <AppShell>
      <main className="mx-auto max-w-4xl px-4 py-6 md:px-8">
        <section className="rounded-xl border border-white/10 bg-white/[0.04] p-6 md:p-8">
          <p className="text-sm uppercase tracking-[0.2em] text-cyan-200">About NexTrack</p>
          <h1 className="mt-3 font-display text-4xl font-semibold">A focused tracker for anime, movies, and TV.</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-zinc-300">
            NexTrack helps people save titles, track episode progress, mark favorites, and keep a personal watchlist organized
            without the clutter common in larger entertainment platforms.
          </p>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            ["Track progress", "Save episode counts, completion status, and recent activity in one place."],
            ["Manage your library", "Keep anime, movies, and series grouped by watching state and favorites."],
            ["Stay consistent", "Use one profile and one dashboard to continue where you left off."]
          ].map(([title, body]) => (
            <article key={title} className="rounded-xl border border-white/10 bg-black/20 p-5">
              <h2 className="font-display text-xl font-semibold">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-400">{body}</p>
            </article>
          ))}
        </section>
      </main>
    </AppShell>
  );
}
