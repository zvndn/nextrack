import { CollectionPage } from "@/components/pages/collection-page";
import { auth } from "@/lib/auth";
import { getReleaseCalendarForUser } from "@/lib/release-calendar";

type Props = {
  searchParams: Promise<{ q?: string }>;
};

export default async function DiscoverPage({ searchParams }: Props) {
  const { q = "" } = await searchParams;
  const session = await auth();
  const releaseItems = session?.user?.id ? await getReleaseCalendarForUser(session.user.id) : [];

  return (
    <CollectionPage
      title="Discover"
      description="Search anime, movies, and TV series using live source-backed results."
      filter="all"
      initialQuery={q}
      releaseItems={releaseItems}
      signedIn={Boolean(session?.user?.id)}
    />
  );
}
