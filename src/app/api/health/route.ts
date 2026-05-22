export function GET() {
  return Response.json({
    ok: true,
    app: "NexTrack",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV ?? "development"
  });
}
