const MAX_JSON_BYTES = 16_384;

export async function readJsonObject(request: Request): Promise<Record<string, unknown> | null> {
  const length = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(length) && length > MAX_JSON_BYTES) return null;

  const raw = await request.text();
  if (!raw || raw.length > MAX_JSON_BYTES) return null;

  try {
    const value: unknown = JSON.parse(raw);
    return typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : null;
  } catch {
    return null;
  }
}
