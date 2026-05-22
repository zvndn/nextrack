import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { ReleaseCalendarMatrix } from "@/components/release/release-calendar-matrix";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getReleaseCalendarFullForUser } from "@/lib/release-calendar";

export const metadata: Metadata = {
  title: "Calendar",
  description: "See upcoming episode releases for your tracked anime and TV series on a monthly calendar view."
};

export default async function CalendarPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const items = await getReleaseCalendarFullForUser(session.user.id);

  return (
    <AppShell>
      <main className="px-4 py-6 md:px-8">
        <h1 className="font-display text-4xl font-semibold">Calendar</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Upcoming episode releases for your tracked anime and TV series.
        </p>

        <div className="mt-6">
          <ReleaseCalendarMatrix items={items} />
        </div>
      </main>
    </AppShell>
  );
}
