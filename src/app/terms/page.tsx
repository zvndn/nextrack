import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Basic usage terms for the public NexTrack deployment."
};

export default function TermsPage() {
  return (
    <AppShell>
      <main className="mx-auto max-w-4xl px-4 py-6 md:px-8">
        <section className="rounded-xl border border-white/10 bg-white/[0.04] p-6 md:p-8">
          <h1 className="font-display text-4xl font-semibold">Terms of Service</h1>
          <div className="mt-6 grid gap-5 text-sm leading-7 text-zinc-400">
            <p>
              By using NexTrack, users agree not to abuse the service, attempt unauthorized access, upload harmful content, or interfere
              with other accounts or the platform’s availability.
            </p>
            <div>
              <h2 className="font-display text-xl font-semibold text-white">Accounts</h2>
              <p>You are responsible for the activity associated with your account and the accuracy of the information you provide.</p>
            </div>
            <div>
              <h2 className="font-display text-xl font-semibold text-white">Content and availability</h2>
              <p>Metadata accuracy and service availability are provided on a best-effort basis and may change without notice.</p>
            </div>
            <div>
              <h2 className="font-display text-xl font-semibold text-white">Termination</h2>
              <p>Access may be limited or removed in case of abuse, misuse, or behavior that harms the service or other users.</p>
            </div>
          </div>
        </section>
      </main>
    </AppShell>
  );
}
