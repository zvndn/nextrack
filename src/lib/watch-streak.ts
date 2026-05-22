import { prisma } from "@/lib/prisma";

function startOfUtcDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function addUtcDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

export function utcDayKey(date: Date) {
  return startOfUtcDay(date).toISOString().slice(0, 10);
}

export function dateValuesToDayKeys(dates: Array<Date | null | undefined>) {
  return dates.filter((date): date is Date => Boolean(date)).map((date) => utcDayKey(date));
}

export async function recordWatchActivity(userId: string, mediaId?: string | null, date = new Date()) {
  const dayKey = utcDayKey(date);

  await prisma.watchActivity.upsert({
    where: { userId_dayKey: { userId, dayKey } },
    update: { mediaId: mediaId ?? undefined },
    create: {
      userId,
      mediaId: mediaId ?? null,
      dayKey
    }
  });
}

export function calculateWatchStreak(dayKeys: string[], now = new Date()) {
  const uniqueDayKeys = [...new Set(dayKeys)].filter(Boolean).sort();
  if (!uniqueDayKeys.length) return 0;

  const daySet = new Set(uniqueDayKeys);
  let cursor = startOfUtcDay(now);

  if (!daySet.has(utcDayKey(cursor))) {
    cursor = addUtcDays(cursor, -1);
    if (!daySet.has(utcDayKey(cursor))) return 0;
  }

  let streak = 0;
  while (daySet.has(utcDayKey(cursor))) {
    streak += 1;
    cursor = addUtcDays(cursor, -1);
  }

  return streak;
}
