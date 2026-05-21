import Image from "next/image";
import Link from "next/link";
import { Play } from "lucide-react";

type ProgressCardProps = {
  id: string;
  title: string;
  type: string;
  meta: string;
  image?: string | null;
  progress: number;
};

export function ProgressCard({ id, title, type, meta, image, progress }: ProgressCardProps) {
  return (
    <Link
      href={`/media/${id}`}
      className="grid grid-cols-[86px_1fr] gap-4 rounded-lg border border-white/10 bg-white/[0.04] p-3 transition hover:border-cyan-300/40"
    >
      <div className="relative h-28 overflow-hidden rounded-md bg-zinc-900">
        {image ? (
          <Image src={image} alt={title} fill sizes="86px" className="object-cover" />
        ) : (
          <div className="grid h-full place-items-center px-2 text-center text-xs text-zinc-600">No image</div>
        )}
      </div>
      <div className="min-w-0 py-1">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs uppercase text-cyan-200">{type}</span>
          <Play className="h-4 w-4 text-zinc-400" />
        </div>
        <h3 className="mt-2 truncate font-semibold text-white">{title}</h3>
        <p className="mt-1 text-sm text-zinc-400">{meta}</p>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-cyan-300" style={{ width: `${progress}%` }} />
        </div>
        <p className="mt-2 text-xs text-zinc-500">{progress}% complete</p>
      </div>
    </Link>
  );
}
