import { CollectionPage } from "@/components/pages/collection-page";

type Props = {
  searchParams: Promise<{ q?: string }>;
};

export default async function DiscoverPage({ searchParams }: Props) {
  const { q = "" } = await searchParams;

  return (
    <CollectionPage
      title="Discover"
      description="Search anime, movies, and TV series using live source-backed results."
      filter="all"
      initialQuery={q}
    />
  );
}
