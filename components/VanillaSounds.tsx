"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { loadVanillaSounds, eventFromPath, MCVersion, VanillaSound } from "@/lib/vanilla";
import { Loader2, Play, Pause, Repeat, Search, Music } from "lucide-react";

const soundCache = new Map<string, VanillaSound[]>();

export default function VanillaSounds({ version }: { version: MCVersion }) {
  const s = useStore();
  const [sounds, setSounds] = useState<VanillaSound[] | null>(soundCache.get(version.id) ?? null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");
  const [playing, setPlaying] = useState<string>("");
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => { setSounds(soundCache.get(version.id) ?? null); setErr(""); setPlaying(""); }, [version.id]);

  const load = async () => {
    setBusy(true); setErr("");
    try {
      const list = await loadVanillaSounds(version);
      soundCache.set(version.id, list);
      setSounds(list);
    } catch (e: any) { setErr(e.message || "Couldn't load sounds."); }
    finally { setBusy(false); }
  };

  const filtered = useMemo(() => {
    if (!sounds) return [];
    const ql = q.toLowerCase();
    return (ql ? sounds.filter((x) => x.path.toLowerCase().includes(ql)) : sounds).slice(0, 600);
  }, [sounds, q]);

  const togglePlay = (snd: VanillaSound) => {
    const a = audioRef.current; if (!a) return;
    if (playing === snd.path) { a.pause(); setPlaying(""); return; }
    a.src = snd.url; a.currentTime = 0;
    a.play().then(() => setPlaying(snd.path)).catch(() => setErr("Playback blocked — click again."));
  };

  const replace = (snd: VanillaSound) => {
    s.setPendingEvent(eventFromPath(snd.path));
    s.setPanel("sounds");
  };

  if (!sounds) {
    return (
      <div className="grid h-full place-items-center p-6">
        <div className="max-w-md text-center">
          <Music size={40} className="mx-auto mb-3 text-accent" />
          <h3 className="mb-1 text-lg font-semibold">Browse every vanilla sound</h3>
          <p className="mb-4 text-sm text-neutral-400">
            Loads the full sound catalogue for <span className="font-mono">{version.id}</span> from Mojang's asset
            index. Preview any sound in your browser, then send its event to the Sounds tab to drop in your own audio.
          </p>
          {!busy
            ? <button onClick={load} className="btn btn-accent mx-auto"><Music size={15} /> Load sound catalogue</button>
            : <div className="flex items-center justify-center gap-2 text-sm text-accent"><Loader2 size={15} className="animate-spin" /> Loading…</div>}
          {err && <div className="mt-3 text-xs text-red-400">{err}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center gap-2 border-b border-line bg-ink-900 px-3 py-2">
        <div className="relative">
          <Search size={13} className="absolute left-2 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search sounds…"
            className="w-64 rounded-md border border-line bg-ink-850 py-1 pl-7 pr-2 text-sm outline-none focus:border-accent-dim" />
        </div>
        <span className="text-xs text-neutral-500">{filtered.length}{filtered.length === 600 ? "+" : ""} of {sounds.length}</span>
        {err && <span className="text-xs text-red-400">{err}</span>}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        <div className="space-y-1">
          {filtered.map((snd) => (
            <div key={snd.path} className="flex items-center gap-2 rounded-md border border-line bg-ink-850 px-2 py-1.5">
              <button onClick={() => togglePlay(snd)}
                className={`grid h-8 w-8 shrink-0 place-items-center rounded-md ${playing === snd.path ? "bg-accent-soft text-ink-950" : "bg-ink-700 hover:bg-ink-600"}`}>
                {playing === snd.path ? <Pause size={13} /> : <Play size={13} />}
              </button>
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-medium">{snd.path}</div>
                <div className="truncate font-mono text-[10px] text-neutral-500">{eventFromPath(snd.path)}</div>
              </div>
              <span className="shrink-0 text-[10px] text-neutral-600">{(snd.size / 1024).toFixed(0)} KB</span>
              <button onClick={() => replace(snd)} title="Replace this sound in your pack"
                className="btn btn-soft shrink-0 text-[11px]"><Repeat size={12} /> Replace</button>
            </div>
          ))}
        </div>
        {!filtered.length && <div className="grid h-40 place-items-center text-sm text-neutral-600">No matches.</div>}
      </div>
      <audio ref={audioRef} hidden onEnded={() => setPlaying("")} />
    </div>
  );
}
