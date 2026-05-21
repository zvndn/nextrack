"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export function HeaderSearch() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();
    router.push(trimmed ? `/discover?q=${encodeURIComponent(trimmed)}` : "/discover");
  }

  return (
    <form
      onSubmit={onSubmit}
      className="hidden h-10 max-w-md flex-1 items-center gap-3 rounded-md border border-white/10 bg-white/[0.04] px-3 text-sm md:flex"
    >
      <Search className="h-4 w-4 text-zinc-500" />
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search your next title"
        className="h-full min-w-0 flex-1 bg-transparent text-white outline-none placeholder:text-zinc-500"
      />
    </form>
  );
}
