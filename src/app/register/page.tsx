import Link from "next/link";
import { AuthPanel } from "@/components/auth/auth-panel";

export default function RegisterPage() {
  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <section className="w-full max-w-md rounded-lg border border-white/10 bg-white/[0.04] p-6">
        <Link href="/" className="font-display text-2xl font-semibold text-white">NexTrack</Link>
        <h1 className="font-display mt-8 text-3xl font-semibold">Create account</h1>
        <p className="mt-2 text-sm text-zinc-400">Start tracking anime, movies, and TV series.</p>
        <div className="mt-6">
          <AuthPanel mode="register" />
        </div>
        <p className="mt-5 text-sm text-zinc-400">
          Already have an account? <Link href="/login" className="text-cyan-200">Sign in</Link>
        </p>
      </section>
    </main>
  );
}
