import { AppShell } from "@/components/layout/app-shell";
import { DiscoverContentTabs } from "@/components/discover/discover-content-tabs";
import type { ReleaseCalendarItem } from "@/lib/release-calendar";
import type { MediaSearchType } from "@/lib/media-sources";

type CollectionPageProps = {
  title: string;
  description: string;
  filter: "all" | "Anime" | "Movie" | "TV Series";
  initialQuery?: string;
  releaseItems?: ReleaseCalendarItem[];
  signedIn?: boolean;
};

export function CollectionPage({ title, description, filter, initialQuery = "", releaseItems = [], signedIn = false }: CollectionPageProps) {
  const initialType: MediaSearchType = filter === "Anime" ? "anime" : filter === "Movie" ? "movie" : filter === "TV Series" ? "tv" : "all";

  return (
    <AppShell>
      <main className="px-4 py-6 md:px-8">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="font-display text-4xl font-semibold">{title}</h1>
            <p className="mt-2 max-w-2xl text-sm text-zinc-400">{description}</p>
          </div>
        </div>

        <DiscoverContentTabs
          initialType={initialType}
          initialQuery={initialQuery}
          releaseItems={releaseItems}
          signedIn={signedIn}
        />
      </main>
    </AppShell>
  );
}
