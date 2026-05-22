"use client";

import { useState } from "react";
import { SearchClient } from "@/components/discover/search-client";
import { ReleaseCalendarList } from "@/components/release/release-calendar-list";
import type { MediaSearchType } from "@/lib/media-sources";
import type { ReleaseCalendarItem } from "@/lib/release-calendar";

type Props = {
  initialType: MediaSearchType;
  initialQuery: string;
  releaseItems: ReleaseCalendarItem[];
  signedIn: boolean;
};

export function DiscoverContentTabs({ initialType, initialQuery, releaseItems, signedIn }: Props) {
  const [activeTab, setActiveTab] = useState<"search" | "calendar">("search");

  return (
    <section>
      <div className="mb-6 inline-flex rounded-md border border-white/10 bg-white/[0.04] p-1">
        <button
          type="button"
          onClick={() => setActiveTab("search")}
          className={`rounded-md px-3 py-2 text-sm transition ${activeTab === "search" ? "bg-cyan-300 text-slate-950" : "text-zinc-300 hover:text-white"}`}
        >
          Search
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("calendar")}
          className={`rounded-md px-3 py-2 text-sm transition ${activeTab === "calendar" ? "bg-cyan-300 text-slate-950" : "text-zinc-300 hover:text-white"}`}
        >
          Release calendar
        </button>
      </div>

      {activeTab === "search" ? (
        <SearchClient initialType={initialType} initialQuery={initialQuery} />
      ) : (
        <div>
          <div className="mb-4">
            <h2 className="font-display text-2xl font-semibold">Release calendar</h2>
            <p className="mt-1 text-sm text-zinc-500">Upcoming episodes and drops for titles you already follow in your library.</p>
          </div>
          <ReleaseCalendarList
            items={releaseItems}
            emptyMessage={
              signedIn
                ? "No upcoming releases found yet. Add a currently airing anime or TV series to your watchlist."
                : "Sign in to see upcoming episodes and releases for the titles in your watchlist."
            }
          />
        </div>
      )}
    </section>
  );
}
