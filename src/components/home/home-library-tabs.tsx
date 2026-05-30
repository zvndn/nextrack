"use client";

import { useState } from "react";
import { ProgressCard } from "@/components/media/progress-card";
import { ReleaseCalendarList } from "@/components/release/release-calendar-list";
import type { ReleaseCalendarItem } from "@/lib/release-calendar";

type ContinueItem = {
  id: string;
  title: string;
  type: string;
  progress: number;
  meta: string;
  image?: string | null;
};

type Props = {
  continueItems: ContinueItem[];
  releaseItems: ReleaseCalendarItem[];
};

export function HomeLibraryTabs({ continueItems, releaseItems }: Props) {
  const [activeTab, setActiveTab] = useState<"continue" | "calendar">("continue");

  return (
    <section>
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold">Library pulse</h2>
          <p className="mt-1 text-sm text-zinc-500">Jump back into active titles or see what drops next.</p>
        </div>
        <div className="inline-flex w-full rounded-md border border-white/10 bg-white/[0.04] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] sm:w-auto">
          <button
            type="button"
            onClick={() => setActiveTab("continue")}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-semibold transition sm:flex-none ${activeTab === "continue" ? "bg-cyan-300 text-slate-950 shadow-[0_10px_24px_rgb(var(--accent-rgb)/0.16)]" : "text-zinc-300 hover:bg-white/7 hover:text-white"}`}
          >
            Continue watching
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("calendar")}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-semibold transition sm:flex-none ${activeTab === "calendar" ? "bg-cyan-300 text-slate-950 shadow-[0_10px_24px_rgb(var(--accent-rgb)/0.16)]" : "text-zinc-300 hover:bg-white/7 hover:text-white"}`}
          >
            Release calendar
          </button>
        </div>
      </div>

      {activeTab === "continue" ? (
        continueItems.length ? (
          <div className="grid gap-4 lg:grid-cols-3">
            {continueItems.map((item) => (
              <ProgressCard key={item.id} {...item} />
            ))}
          </div>
        ) : (
          <div className="panel rounded-lg p-5 text-sm text-zinc-400">
            No active titles yet. Add something from Discover, then mark it as watching or save episode progress.
          </div>
        )
      ) : (
        <ReleaseCalendarList
          items={releaseItems}
          emptyMessage="No upcoming releases found yet. Add a currently airing anime or a returning TV series to your watchlist."
        />
      )}
    </section>
  );
}
