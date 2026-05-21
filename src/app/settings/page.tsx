import { AppShell } from "@/components/layout/app-shell";
import { SettingsForm } from "@/components/settings/settings-form";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function SettingsPage() {
  const session = await auth();
  const user = session?.user?.id ? await prisma.user.findUnique({ where: { id: session.user.id } }) : null;

  return (
    <AppShell>
      <main className="max-w-5xl px-4 py-6 md:px-8">
        <h1 className="font-display text-4xl font-semibold">Settings</h1>
        <p className="mt-2 text-sm text-zinc-400">Manage your profile, appearance, and local workspace preferences.</p>
        <div className="mt-6">
          {user ? (
            <SettingsForm
              initial={{
                name: user.name ?? "",
                username: user.username ?? "",
                bio: user.bio ?? "",
                image: user.image ?? "",
                location: user.location ?? "",
                website: user.website ?? "",
                autoFavoriteOnComplete: user.autoFavoriteOnComplete
              }}
            />
          ) : (
            <section className="rounded-lg border border-white/10 bg-white/[0.04] p-5 text-sm text-zinc-300">
              Sign in to edit profile settings.
            </section>
          )}
        </div>
      </main>
    </AppShell>
  );
}
