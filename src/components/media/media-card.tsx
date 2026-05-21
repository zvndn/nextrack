import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";

type MediaCardProps = {
  id: string;
  title: string;
  type: string;
  image?: string | null;
  rating?: string;
  genre?: string;
};

export function MediaCard({ id, title, type, image, rating, genre }: MediaCardProps) {
  return (
    <Link
      href={`/media/${id}`}
      className="group block overflow-hidden rounded-lg border border-white/10 bg-white/[0.04] transition hover:-translate-y-1 hover:border-cyan-300/40"
    >
      <div className="relative aspect-[2/3] overflow-hidden bg-zinc-900">
        {image ? (
          <Image
            src={image}
            alt={title}
            fill
            sizes="(max-width: 768px) 45vw, 220px"
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full place-items-center px-3 text-center text-xs text-zinc-600">No image</div>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-3">
          <div className="flex items-center justify-between text-xs">
            <span className="rounded bg-white/10 px-2 py-1 text-white backdrop-blur">{type}</span>
            {rating ? (
              <span className="flex items-center gap-1 rounded bg-black/50 px-2 py-1 text-amber-200">
                <Star className="h-3 w-3 fill-amber-300" />
                {rating}
              </span>
            ) : null}
          </div>
        </div>
      </div>
      <div className="p-3">
        <h3 className="line-clamp-2 min-h-10 text-sm font-semibold text-white">{title}</h3>
        <p className="mt-1 text-xs text-zinc-400">{genre ?? "Tracked media"}</p>
      </div>
    </Link>
  );
}
