import { CollectionPage } from "@/components/pages/collection-page";

export default function MoviesPage() {
  return (
    <CollectionPage
      title="Movies"
      description="Search films, save them, mark them completed, and keep a clean favorites list."
      filter="Movie"
    />
  );
}
