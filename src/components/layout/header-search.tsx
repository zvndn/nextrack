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
      className="header-search hidden h-10 max-w-md flex-1 items-center gap-3 rounded-md px-3 text-sm md:flex"
    >
      <Search className="header-search-icon h-4 w-4" />
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search your next title"
        className="header-search-input h-full min-w-0 flex-1 bg-transparent outline-none"
      />
    </form>
  );
}
