# NexTrack

NexTrack is a personal tracker for anime, movies, and television: discover titles, track progress, keep a shareable library, and build a more intentional watch habit.

## V2 highlights

- **Smart queue:** the dashboard now recommends the next three titles using a private, explainable score. Active and nearly-finished titles come first; stalled titles and highly rated plans follow.
- **More defensive APIs:** watchlist and progress mutations accept only small JSON objects (16 KB maximum), avoiding accidental or abusive oversized payloads before database work begins.
- **Rust for batch ranking:** `crates/nextrack-ranking` mirrors the queue scoring contract in dependency-free Rust. It is designed for a future import/worker or WASM path, where ranking thousands of titles without a Node runtime is a useful hot path. The Next.js UI keeps its TypeScript implementation so it remains deployable without native build requirements.

## Local development

1. Copy `.env.example` to `.env` and set `DATABASE_URL`, `AUTH_SECRET`, and any configured media-provider keys.
2. Install packages with `pnpm install`.
3. Generate Prisma client with `pnpm db:generate`.
4. Apply your database schema with `pnpm db:push` (or use migrations in a production workflow).
5. Start the app with `pnpm dev`.

## Verification

Run `pnpm lint` and `pnpm build` for the web app. If Rust is installed, run `cargo test --manifest-path crates/nextrack-ranking/Cargo.toml` for the scorer contract.

The smart queue is intentionally not stored in the database: recommendations are recalculated from a user’s own library and no viewing data is sent to a third party.
