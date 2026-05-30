"use client";

import { ChangeEvent, FormEvent, useEffect, useState, useTransition } from "react";
import { Check, Download, Eye, MonitorCog, Paintbrush, RotateCcw, Shield, Upload, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  applyAppearance,
  appearanceStorageKey,
  defaultAppearance,
  readAppearance,
  type AppearanceSettings
} from "@/components/settings/appearance-controller";

type SettingsFormProps = {
  initial: {
    name: string;
    username: string;
    bio: string;
    image: string;
    location: string;
    website: string;
    autoFavoriteOnComplete: boolean;
  };
};

type SettingsTab = "profile" | "appearance" | "preferences";

const tabs: { value: SettingsTab; label: string; icon: typeof User }[] = [
  { value: "profile", label: "Profile", icon: User },
  { value: "appearance", label: "Appearance", icon: Paintbrush },
  { value: "preferences", label: "Preferences", icon: MonitorCog }
];

const themeOptions: {
  value: AppearanceSettings["theme"];
  label: string;
  description: string;
  swatches: string[];
}[] = [
  { value: "midnight", label: "Midnight", description: "Cinematic black with cyan focus and deep poster contrast.", swatches: ["#080b12", "#121827", "#67e8f9"] },
  { value: "graphite", label: "Graphite", description: "Neutral charcoal surfaces for long tracking sessions.", swatches: ["#101114", "#20242a", "#a1a1aa"] },
  { value: "light", label: "Studio Light", description: "Clean daylight interface with crisp cards and muted borders.", swatches: ["#f8fafc", "#ffffff", "#0284c7"] },
  { value: "nordic", label: "Nordic Frost", description: "Cold slate, icy highlights, and soft blue atmospheric depth.", swatches: ["#0b111a", "#162235", "#7dd3fc"] },
  { value: "sunset", label: "Sunset Ember", description: "Warm burgundy shadows with ember accents for evening use.", swatches: ["#12080b", "#2a1014", "#f59e0b"] },
  { value: "sakura", label: "Sakura Bloom", description: "Soft rose daylight with warm paper surfaces and calm contrast.", swatches: ["#fff5f7", "#ffffff", "#fb7185"] },
  { value: "ocean", label: "Deep Ocean", description: "Blue-black depth, teal glass, and high-legibility aqua accents.", swatches: ["#03131f", "#082f49", "#2dd4bf"] },
  { value: "forest", label: "Forest Canopy", description: "Grounded evergreen tones with moss highlights and quiet surfaces.", swatches: ["#07130d", "#10281b", "#86efac"] },
  { value: "royal", label: "Royal Violet", description: "Dark plum workspace with refined violet and blue highlights.", swatches: ["#12091f", "#24113b", "#c4b5fd"] },
  { value: "noir", label: "Noir Mono", description: "Almost monochrome black, clean borders, and restrained contrast.", swatches: ["#050505", "#171717", "#f5f5f5"] },
  { value: "copper", label: "Copper Sand", description: "Bright warm editorial surfaces with copper controls and ink text.", swatches: ["#fff8ed", "#f3e4d0", "#c2410c"] },
  { value: "aurora", label: "Aurora", description: "Northern green and violet gradients over polished dark panels.", swatches: ["#061216", "#11201f", "#5eead4"] }
];

const accentOptions: { value: AppearanceSettings["accent"]; label: string; swatch: string }[] = [
  { value: "cyan", label: "Cyan", swatch: "#67e8f9" },
  { value: "blue", label: "Blue", swatch: "#60a5fa" },
  { value: "indigo", label: "Indigo", swatch: "#a5b4fc" },
  { value: "violet", label: "Violet", swatch: "#c4b5fd" },
  { value: "emerald", label: "Emerald", swatch: "#6ee7b7" },
  { value: "lime", label: "Lime", swatch: "#bef264" },
  { value: "rose", label: "Rose", swatch: "#fda4af" },
  { value: "pink", label: "Pink", swatch: "#f9a8d4" },
  { value: "amber", label: "Amber", swatch: "#fcd34d" },
  { value: "orange", label: "Orange", swatch: "#fdba74" },
  { value: "white", label: "White", swatch: "#f8fafc" }
];

export function SettingsForm({ initial }: SettingsFormProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [message, setMessage] = useState("");
  const [appearanceMessage, setAppearanceMessage] = useState("");
  const [appearance, setAppearance] = useState<AppearanceSettings>(defaultAppearance);
  const [autoFavoriteOnComplete, setAutoFavoriteOnComplete] = useState(initial.autoFavoriteOnComplete);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setAppearance(readAppearance());
  }, []);

  function updateAppearance(next: AppearanceSettings) {
    setAppearance(next);
    applyAppearance(next);
    window.localStorage.setItem(appearanceStorageKey, JSON.stringify(next));
    setAppearanceMessage("Appearance saved on this device.");
  }

  function resetAppearance() {
    updateAppearance(defaultAppearance);
  }

  function exportAppearance() {
    const payload = JSON.stringify(appearance, null, 2);
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "nextrack-appearance.json";
    link.click();
    URL.revokeObjectURL(url);
    setAppearanceMessage("Appearance settings exported.");
  }

  function importAppearance(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        const next: AppearanceSettings = {
          ...defaultAppearance,
          ...parsed
        };

        updateAppearance(next);
        setAppearanceMessage("Appearance settings imported.");
      } catch {
        setAppearanceMessage("Import failed. Choose a valid NexTrack appearance file.");
      } finally {
        event.target.value = "";
      }
    };

    reader.readAsText(file);
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const form = new FormData(event.currentTarget);

    startTransition(async () => {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          username: form.get("username"),
          bio: form.get("bio"),
          image: form.get("image"),
          location: form.get("location"),
          website: form.get("website")
        })
      });

      const payload = await response.json();
      setMessage(response.ok ? "Profile updated." : payload.error ?? "Update failed.");
    });
  }

  function savePreferences() {
    setMessage("");

    startTransition(async () => {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          autoFavoriteOnComplete
        })
      });

      const payload = await response.json();
      setMessage(response.ok ? "Preferences updated." : payload.error ?? "Update failed.");
    });
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[220px_1fr]">
      <nav className="flex flex-row overflow-x-auto gap-1 lg:flex-col lg:overflow-visible rounded-lg border border-white/10 bg-white/[var(--surface-alpha)] p-2 scrollbar-none">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`flex h-11 items-center gap-3 rounded-md px-3 text-left text-sm transition whitespace-nowrap flex-shrink-0 lg:w-full ${
              activeTab === tab.value ? "bg-cyan-300 text-slate-950" : "text-zinc-300 hover:bg-white/10 hover:text-white"
            }`}
            type="button"
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="min-w-0">
        {activeTab === "profile" ? (
          <form onSubmit={onSubmit} className="grid gap-4 rounded-lg border border-white/10 bg-white/[var(--surface-alpha)] p-5">
            <div>
              <h2 className="font-display text-2xl font-semibold">Public profile</h2>
              <p className="mt-1 text-sm text-zinc-500">These details appear on your profile and account surfaces.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm text-zinc-300">
                Display name
                <input name="name" defaultValue={initial.name} className="h-11 rounded-md border border-white/10 bg-black/30 px-3 text-white outline-none focus:border-cyan-300" />
              </label>
              <label className="grid gap-2 text-sm text-zinc-300">
                Username
                <input name="username" defaultValue={initial.username} className="h-11 rounded-md border border-white/10 bg-black/30 px-3 text-white outline-none focus:border-cyan-300" />
              </label>
              <label className="grid gap-2 text-sm text-zinc-300">
                Location
                <input name="location" defaultValue={initial.location} placeholder="City, country" className="h-11 rounded-md border border-white/10 bg-black/30 px-3 text-white outline-none focus:border-cyan-300" />
              </label>
              <label className="grid gap-2 text-sm text-zinc-300">
                Website
                <input name="website" defaultValue={initial.website} placeholder="https://..." className="h-11 rounded-md border border-white/10 bg-black/30 px-3 text-white outline-none focus:border-cyan-300" />
              </label>
            </div>
            <label className="grid gap-2 text-sm text-zinc-300">
              Avatar URL
              <input name="image" defaultValue={initial.image} placeholder="https://..." className="h-11 rounded-md border border-white/10 bg-black/30 px-3 text-white outline-none focus:border-cyan-300" />
            </label>
            <label className="grid gap-2 text-sm text-zinc-300">
              Bio
              <textarea name="bio" defaultValue={initial.bio} rows={4} className="rounded-md border border-white/10 bg-black/30 p-3 text-white outline-none focus:border-cyan-300" />
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" disabled={isPending}>{isPending ? "Saving..." : "Save profile"}</Button>
              {message ? <p className="text-sm text-zinc-300">{message}</p> : null}
            </div>
          </form>
        ) : null}

        {activeTab === "appearance" ? (
          <section className="grid gap-5 rounded-lg border border-white/10 bg-white/[var(--surface-alpha)] p-5">
            <div>
              <h2 className="font-display text-2xl font-semibold">Appearance</h2>
              <p className="mt-1 text-sm text-zinc-500">Theme choices are saved locally and apply across the site.</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {themeOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => updateAppearance({ ...appearance, theme: option.value })}
                  className={`rounded-lg border p-4 text-left transition ${
                    appearance.theme === option.value ? "border-cyan-300 bg-cyan-300/10" : "border-white/10 bg-black/20 hover:bg-white/10"
                  }`}
                >
                  <span className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2 font-semibold text-white">
                      <span className="flex overflow-hidden rounded-full border border-white/10">
                        {option.swatches.map((swatch) => (
                          <span key={swatch} className="h-5 w-5" style={{ backgroundColor: swatch }} />
                        ))}
                      </span>
                      {option.label}
                    </span>
                    {appearance.theme === option.value ? <Check className="h-4 w-4 text-cyan-200" /> : null}
                  </span>
                  <span className="mt-2 block text-sm text-zinc-400">{option.description}</span>
                </button>
              ))}
            </div>

            <div>
              <h3 className="font-display text-xl font-semibold">Accent color</h3>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {accentOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => updateAppearance({ ...appearance, accent: option.value })}
                    className={`flex items-center gap-3 rounded-md border p-3 text-sm transition ${
                      appearance.accent === option.value ? "border-cyan-300 bg-white/10 text-white" : "border-white/10 bg-black/20 text-zinc-300 hover:bg-white/10"
                    }`}
                  >
                    <span className="h-5 w-5 rounded-full" style={{ backgroundColor: option.swatch }} />
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-white/10 bg-black/25 p-4">
              <div className="flex items-center gap-2 text-sm text-cyan-200">
                <Eye className="h-4 w-4" />
                Live preview
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <div className="rounded-md border border-white/10 bg-white/[0.06] p-3">
                  <div className="h-2 w-16 rounded bg-cyan-300" />
                  <p className="mt-3 text-sm font-semibold text-white">Tracker card</p>
                  <p className="mt-1 text-xs text-zinc-400">Accent, surfaces, and page background update immediately.</p>
                </div>
                <div className="rounded-md border border-white/10 bg-black/30 p-3">
                  <div className="h-2 rounded-full bg-white/10">
                    <div className="h-2 w-2/3 rounded-full bg-cyan-300" />
                  </div>
                  <p className="mt-3 text-xs text-zinc-400">Progress controls</p>
                </div>
                <div className="grid place-items-center rounded-md border border-white/10 bg-black/30 p-3">
                  <Button type="button">Action</Button>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button type="button" variant="ghost" onClick={exportAppearance}>
                <Download className="h-4 w-4" />
                Export appearance
              </Button>
              <label className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-white/10 bg-white/5 px-4 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition hover:border-white/20 hover:bg-white/10">
                <Upload className="h-4 w-4" />
                Import appearance
                <input type="file" accept="application/json,.json" onChange={importAppearance} className="sr-only" />
              </label>
              <Button type="button" variant="ghost" onClick={resetAppearance}>
                <RotateCcw className="h-4 w-4" />
                Reset appearance
              </Button>
              {appearanceMessage ? <p className="text-sm text-zinc-300">{appearanceMessage}</p> : null}
            </div>
          </section>
        ) : null}

        {activeTab === "preferences" ? (
          <section className="grid gap-5 rounded-lg border border-white/10 bg-white/[var(--surface-alpha)] p-5">
            <div>
              <h2 className="font-display text-2xl font-semibold">Workspace preferences</h2>
              <p className="mt-1 text-sm text-zinc-500">These local controls tune layout behavior on this device.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm text-zinc-300">
                Interface density
                <select
                  value={appearance.density}
                  onChange={(event) => updateAppearance({ ...appearance, density: event.target.value as AppearanceSettings["density"] })}
                  className="h-11 rounded-md border border-white/10 bg-black/30 px-3 text-white outline-none focus:border-cyan-300"
                >
                  <option value="comfortable" className="bg-zinc-950">Comfortable</option>
                  <option value="compact" className="bg-zinc-950">Compact</option>
                </select>
              </label>
              <label className="grid gap-2 text-sm text-zinc-300">
                Motion
                <select
                  value={appearance.motion}
                  onChange={(event) => updateAppearance({ ...appearance, motion: event.target.value as AppearanceSettings["motion"] })}
                  className="h-11 rounded-md border border-white/10 bg-black/30 px-3 text-white outline-none focus:border-cyan-300"
                >
                  <option value="full" className="bg-zinc-950">Full motion</option>
                  <option value="reduced" className="bg-zinc-950">Reduced motion</option>
                </select>
              </label>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-lg border border-white/10 bg-black/20 p-4">
                <div className="flex items-center gap-2 font-semibold text-white">
                  <Shield className="h-4 w-4 text-cyan-200" />
                  Privacy
                </div>
                <p className="mt-2 text-sm text-zinc-400">Appearance preferences stay in this browser. Profile details are saved to your account.</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-black/20 p-4">
                <div className="font-semibold text-white">Account status</div>
                <p className="mt-2 text-sm text-zinc-400">Your watchlist, progress, favorites, and reviews remain tied to your signed-in profile.</p>
              </div>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/20 p-4">
              <div className="font-semibold text-white">Automation</div>
              <p className="mt-2 text-sm text-zinc-400">
                Let NexTrack favorite titles automatically the moment you finish them.
              </p>
              <label className="mt-4 flex items-start gap-3 text-sm text-zinc-300">
                <input
                  type="checkbox"
                  name="autoFavoriteOnComplete"
                  checked={autoFavoriteOnComplete}
                  onChange={(event) => setAutoFavoriteOnComplete(event.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-white/10 bg-black/30 accent-cyan-300"
                />
                <span>
                  Auto-favorite completed titles
                  <span className="mt-1 block text-xs text-zinc-500">
                    When progress reaches 100%, the title is added to Favorites automatically.
                  </span>
                </span>
              </label>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button type="button" onClick={savePreferences} disabled={isPending}>{isPending ? "Saving..." : "Save preferences"}</Button>
              {message ? <p className="text-sm text-zinc-300">{message}</p> : null}
            </div>
            {appearanceMessage ? <p className="text-sm text-zinc-300">{appearanceMessage}</p> : null}
          </section>
        ) : null}
      </div>
    </section>
  );
}
