import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

type EmptyStateProps = {
  title: string;
  body: string;
  actionHref?: string;
  actionLabel?: string;
  icon?: LucideIcon;
};

export function EmptyState({ title, body, actionHref, actionLabel, icon: Icon }: EmptyStateProps) {
  return (
    <div className="rounded-lg border border-dashed border-white/15 bg-white/[0.035] p-5 text-sm text-zinc-400">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 gap-3">
          {Icon ? (
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-cyan-300/10 text-cyan-200">
              <Icon className="h-5 w-5" />
            </span>
          ) : null}
          <div>
            <h3 className="font-semibold text-white">{title}</h3>
            <p className="mt-1 leading-6">{body}</p>
          </div>
        </div>
        {actionHref && actionLabel ? (
          <Button href={actionHref} variant="ghost" className="shrink-0">
            {actionLabel}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
