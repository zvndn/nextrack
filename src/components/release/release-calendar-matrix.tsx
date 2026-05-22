"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, CalendarDays, Tv, Film, Sparkles } from "lucide-react";
import type { ReleaseCalendarItem } from "@/lib/release-calendar";

type Props = {
  items: ReleaseCalendarItem[];
};

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

function getMonthGrid(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const totalDays = lastDay.getDate();

  // getDay() returns 0=Sun, shift to Mon=0
  let startOffset = firstDay.getDay() - 1;
  if (startOffset < 0) startOffset = 6;

  const cells: (number | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= totalDays; d++) cells.push(d);
  // pad tail to fill last row
  while (cells.length % 7 !== 0) cells.push(null);

  return cells;
}

function dateKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function itemDateKey(item: ReleaseCalendarItem) {
  const d = new Date(item.sortTimestamp);
  return dateKey(d.getFullYear(), d.getMonth(), d.getDate());
}

function TypeIcon({ type }: { type: string }) {
  if (type === "Anime") return <Sparkles className="h-3 w-3" />;
  if (type === "Movie") return <Film className="h-3 w-3" />;
  return <Tv className="h-3 w-3" />;
}

export function ReleaseCalendarMatrix({ items }: Props) {
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const grid = useMemo(() => getMonthGrid(viewYear, viewMonth), [viewYear, viewMonth]);

  // Map items by date key
  const itemsByDate = useMemo(() => {
    const map = new Map<string, ReleaseCalendarItem[]>();
    for (const item of items) {
      const key = itemDateKey(item);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    return map;
  }, [items]);

  const todayKey = dateKey(now.getFullYear(), now.getMonth(), now.getDate());

  function navigate(dir: -1 | 1) {
    setSelectedDay(null);
    let m = viewMonth + dir;
    let y = viewYear;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setViewMonth(m);
    setViewYear(y);
  }

  function goToday() {
    setSelectedDay(null);
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
  }

  const selectedItems = selectedDay
    ? itemsByDate.get(dateKey(viewYear, viewMonth, selectedDay)) ?? []
    : [];

  // Count total releases in current month
  const monthReleaseCount = useMemo(() => {
    let count = 0;
    for (const [key, arr] of itemsByDate) {
      const prefix = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-`;
      if (key.startsWith(prefix)) count += arr.length;
    }
    return count;
  }, [itemsByDate, viewYear, viewMonth]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-zinc-400 transition hover:border-cyan-300/30 hover:text-white"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <AnimatePresence mode="wait">
            <motion.h2
              key={`${viewYear}-${viewMonth}`}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.2 }}
              className="font-display min-w-[200px] text-center text-2xl font-semibold"
            >
              {MONTH_NAMES[viewMonth]} {viewYear}
            </motion.h2>
          </AnimatePresence>
          <button
            type="button"
            onClick={() => navigate(1)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-zinc-400 transition hover:border-cyan-300/30 hover:text-white"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-medium text-cyan-200">
            {monthReleaseCount} release{monthReleaseCount !== 1 ? "s" : ""} this month
          </span>
          <button
            type="button"
            onClick={goToday}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium text-zinc-300 transition hover:border-cyan-300/30 hover:text-white"
          >
            <CalendarDays className="h-3.5 w-3.5" />
            Today
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.04]">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-white/10">
          {WEEKDAYS.map((day) => (
            <div key={day} className="px-2 py-3 text-center text-xs font-semibold uppercase tracking-wider text-zinc-500">
              {day}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {grid.map((day, i) => {
            if (day === null) {
              return (
                <div
                  key={`empty-${i}`}
                  className="min-h-[100px] border-b border-r border-white/5 bg-white/[0.01] p-2 last:border-r-0 md:min-h-[120px]"
                />
              );
            }

            const key = dateKey(viewYear, viewMonth, day);
            const dayItems = itemsByDate.get(key) ?? [];
            const isToday = key === todayKey;
            const isSelected = selectedDay === day;
            const hasItems = dayItems.length > 0;

            return (
              <button
                type="button"
                key={`day-${day}`}
                onClick={() => setSelectedDay(isSelected ? null : day)}
                className={`group relative min-h-[100px] border-b border-r border-white/5 p-2 text-left transition-all duration-200 last:border-r-0 md:min-h-[120px] ${
                  isSelected
                    ? "bg-cyan-300/10 ring-1 ring-inset ring-cyan-300/30"
                    : hasItems
                      ? "bg-white/[0.02] hover:bg-white/[0.06]"
                      : "hover:bg-white/[0.03]"
                }`}
              >
                {/* Day number */}
                <span
                  className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                    isToday
                      ? "bg-cyan-300 text-slate-950 font-bold shadow-[0_0_12px_rgba(var(--accent-rgb)/0.4)]"
                      : isSelected
                        ? "text-cyan-200"
                        : "text-zinc-400 group-hover:text-zinc-200"
                  }`}
                >
                  {day}
                </span>

                {/* Release items (compact) */}
                {dayItems.length > 0 && (
                  <div className="mt-1 space-y-1">
                    {dayItems.slice(0, 3).map((item) => (
                      <div
                        key={item.mediaId}
                        className={`flex items-center gap-1.5 rounded px-1.5 py-0.5 text-[10px] font-medium leading-tight transition md:text-[11px] ${
                          item.type === "Anime"
                            ? "bg-purple-400/15 text-purple-300"
                            : item.type === "Movie"
                              ? "bg-amber-400/15 text-amber-300"
                              : "bg-cyan-400/15 text-cyan-300"
                        }`}
                      >
                        <TypeIcon type={item.type} />
                        <span className="truncate">{item.title}</span>
                      </div>
                    ))}
                    {dayItems.length > 3 && (
                      <div className="px-1.5 text-[10px] text-zinc-500">
                        +{dayItems.length - 3} more
                      </div>
                    )}
                  </div>
                )}

                {/* Dot indicator for mobile */}
                {hasItems && (
                  <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-0.5 sm:hidden">
                    {dayItems.slice(0, 3).map((item) => (
                      <span
                        key={item.mediaId}
                        className={`h-1.5 w-1.5 rounded-full ${
                          item.type === "Anime"
                            ? "bg-purple-400"
                            : item.type === "Movie"
                              ? "bg-amber-400"
                              : "bg-cyan-400"
                        }`}
                      />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected day detail panel */}
      <AnimatePresence>
        {selectedDay !== null && (
          <motion.section
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-5">
              <h3 className="font-display text-lg font-semibold">
                {MONTH_NAMES[viewMonth]} {selectedDay}, {viewYear}
              </h3>

              {selectedItems.length === 0 ? (
                <p className="mt-3 text-sm text-zinc-500">No releases scheduled for this day.</p>
              ) : (
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {selectedItems.map((item) => (
                    <Link
                      key={item.mediaId}
                      href={item.href}
                      className="group/card grid grid-cols-[64px_1fr] gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-3 transition hover:border-cyan-300/30 hover:bg-white/[0.06]"
                    >
                      <div className="relative h-[90px] overflow-hidden rounded-md bg-zinc-900">
                        {item.image ? (
                          <Image
                            src={item.image}
                            alt={item.title}
                            fill
                            sizes="64px"
                            className="object-cover transition-transform duration-300 group-hover/card:scale-105"
                          />
                        ) : (
                          <div className="grid h-full place-items-center text-[10px] text-zinc-600">
                            No image
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 py-0.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                              item.type === "Anime"
                                ? "bg-purple-400/15 text-purple-300"
                                : item.type === "Movie"
                                  ? "bg-amber-400/15 text-amber-300"
                                  : "bg-cyan-400/15 text-cyan-300"
                            }`}
                          >
                            <TypeIcon type={item.type} />
                            {item.type}
                          </span>
                          <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-2 py-0.5 text-[10px] font-medium text-cyan-100">
                            {item.badge}
                          </span>
                        </div>
                        <h4 className="mt-1.5 truncate text-sm font-semibold text-white group-hover/card:text-cyan-200">
                          {item.title}
                        </h4>
                        <p className="mt-0.5 text-xs text-zinc-400">{item.when}</p>
                        <p className="mt-1 truncate text-xs text-zinc-500">{item.detail}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-500">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-purple-400" />
          Anime
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-cyan-400" />
          TV Series
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          Movie
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-cyan-300 text-[10px] font-bold text-slate-950">
            {now.getDate()}
          </span>
          Today
        </span>
      </div>
    </div>
  );
}
