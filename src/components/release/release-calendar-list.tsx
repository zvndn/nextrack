import Image from "next/image";
import Link from "next/link";
import type { ReleaseCalendarItem } from "@/lib/release-calendar";

type Props = {
  items: ReleaseCalendarItem[];
  emptyMessage: string;
};

export function ReleaseCalendarList({ items, emptyMessage }: Props) {
  if (!items.length) {
    return (
      <div className="rounded-lg border border-white/10 bg-white/[0.04] p-5 text-sm text-zinc-400">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {items.map((item) => (
        <Link
          key={`${item.mediaId}-${item.badge}`}
          href={item.href}
          className="grid grid-cols-[92px_1fr] gap-4 rounded-lg border border-white/10 bg-white/[0.04] p-3 transition hover:border-cyan-300/40"
        >
          <div className="relative h-28 overflow-hidden rounded-md bg-zinc-900">
            {item.image ? (
              <Image src={item.image} alt={item.title} fill sizes="92px" className="object-cover" />
            ) : (
              <div className="grid h-full place-items-center px-2 text-center text-xs text-zinc-600">No image</div>
            )}
          </div>
          <div className="min-w-0 py-1">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs uppercase text-cyan-200">{item.type}</span>
              <span className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-2 py-1 text-[11px] font-medium text-cyan-100">
                {item.badge}
              </span>
            </div>
            <h3 className="mt-2 truncate font-semibold text-white">{item.title}</h3>
            <p className="mt-1 text-sm text-zinc-300">{item.when}</p>
            <p className="mt-2 text-sm text-zinc-500">{item.detail}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
