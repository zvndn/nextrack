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
  const safeProgress = Math.max(0, Math.min(100, Math.round(progress)));

  return (
    <Link
      href={`/media/${id}`}
      className="interactive-card group grid grid-cols-[86px_minmax(0,1fr)] gap-4 rounded-lg border border-white/10 bg-white/[var(--surface-alpha)] p-3 shadow-[0_16px_48px_rgba(0,0,0,0.14)]"
    >
      <div className="relative h-28 overflow-hidden rounded-md bg-zinc-900">
        {image ? (
          <Image src={image} alt={title} fill sizes="86px" className="object-cover transition duration-500 group-hover:scale-105" />
        ) : (
          <div className="grid h-full place-items-center px-2 text-center text-xs text-zinc-600">No image</div>
        )}
      </div>
      <div className="min-w-0 py-1">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs uppercase text-cyan-200">{type}</span>
          <span className="grid h-7 w-7 place-items-center rounded-md bg-white/5 text-zinc-300 transition group-hover:bg-cyan-300 group-hover:text-black">
            <Play className="h-3.5 w-3.5" />
          </span>
        </div>
        <h3 className="mt-2 truncate font-semibold text-white">{title}</h3>
        <p className="mt-1 text-sm text-zinc-400">{meta}</p>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-cyan-300 shadow-[0_0_18px_rgb(var(--accent-rgb)/0.32)]" style={{ width: `${safeProgress}%` }} />
        </div>
        <p className="mt-2 text-xs text-zinc-500">{safeProgress}% complete</p>
      </div>
    </Link>
  );
}
