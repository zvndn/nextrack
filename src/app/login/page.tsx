import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthPanel } from "@/components/auth/auth-panel";
import { auth } from "@/lib/auth";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user?.id) {
    redirect("/dashboard");
  }

  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <section className="w-full max-w-md rounded-lg border border-white/10 bg-white/[0.04] p-6">
        <Link href="/" className="font-display text-2xl font-semibold text-white">NexTrack</Link>
        <h1 className="font-display mt-8 text-3xl font-semibold">Sign in</h1>
        <p className="mt-2 text-sm text-zinc-400">Continue tracking your media progress.</p>
        <div className="mt-6">
          <AuthPanel mode="login" />
        </div>
        <p className="mt-5 text-sm text-zinc-400">
          New here? <Link href="/register" className="text-cyan-200">Create an account</Link>
        </p>
      </section>
    </main>
  );
}
