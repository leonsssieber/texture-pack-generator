"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { JarHandle, decodeEntry } from "@/lib/jar";
import { getManifest, loadVanillaJar, MCVersion } from "@/lib/vanilla";
import { Boxes, Download, Loader2, Check, Plus, Search, Music } from "lucide-react";
import VanillaSounds from "./VanillaSounds";

// Cache loaded jars across panel switches so we don't re-download.
const jarCache = new Map<string, JarHandle>();

type Entry = JarHandle["entries"][number];

export default function VanillaPanel() {
  const [tab, setTab] = useState<"textures" | "sounds">("textures");
  const [versions, setVersions] = useState<MCVersion[]>([]);
  const [verId, setVerId] = useState<string>("");
  const [err, setErr] = useState("");

  useEffect(() => {
    getManifest().then((m) => {
      const list = m.versions.filter((v) => v.type === "release" || v.type === "snapshot");
      setVersions(list);
      setVerId(m.latest.release);
    }).catch((e) => setErr(e.message));
  }, []);

  const version = versions.find((v) => v.id === verId);

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center gap-2 border-b border-line bg-ink-900 px-4 py-2.5">
        <Boxes size={18} className="text-accent" />
        <h2 className="font-semibold">Vanilla Assets</h2>
        <span className="rounded bg-ink-700 px-1.5 py-0.5 text-[10px] text-accent">live from Mojang</span>
        <div className="ml-auto flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs text-neutral-400">
            Version
            <select value={verId} onChange={(e) => setVerId(e.target.value)}
              className="rounded-md border border-line bg-ink-850 px-2 py-1 text-sm outline-none focus:border-accent-dim">
              {!versions.length && <option>loading…</option>}
              {versions.map((v) => <option key={v.id} value={v.id}>{v.id}{v.type === "snapshot" ? " (snapshot)" : ""}</option>)}
            </select>
          </label>
          <div className="flex gap-1">
            <button onClick={() => setTab("textures")} className={`btn text-xs ${tab === "textures" ? "btn-accent" : "btn-soft"}`}><Boxes size={13} /> Textures</button>
            <button onClick={() => setTab("sounds")} className={`btn text-xs ${tab === "sounds" ? "btn-accent" : "btn-soft"}`}><Music size={13} /> Sounds</button>
          </div>
        </div>
      </div>

      {err && <div className="border-b border-line bg-red-500/10 px-4 py-2 text-xs text-red-400">{err}</div>}

      <div className="min-h-0 flex-1">
        {!version ? (
          <div className="grid h-full place-items-center text-sm text-neutral-500"><Loader2 className="animate-spin" /></div>
        ) : tab === "textures" ? (
          <VanillaTextures version={version} />
        ) : (
          <VanillaSounds version={version} />
        )}
      </div>
    </div>
  );
}

function VanillaTextures({ version }: { version: MCVersion }) {
  const s = useStore();
  const [handle, setHandle] = useState<JarHandle | null>(jarCache.get(version.id) ?? null);
  const [progress, setProgress] = useState<{ loaded: number; total: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [group, setGroup] = useState("block");
  const [q, setQ] = useState("");
  const [addingAll, setAddingAll] = useState<string>("");

  useEffect(() => { setHandle(jarCache.get(version.id) ?? null); setErr(""); }, [version.id]);

  // which mcPaths already exist in the project (so we can show "added")
  const existing = useMemo(() => new Set(s.project.textures.map((t) => t.mcPath)), [s.project.textures]);

  const load = async () => {
    setBusy(true); setErr(""); setProgress({ loaded: 0, total: version ? 1 : 1 });
    try {
      const h = await loadVanillaJar(version, (loaded, total) => setProgress({ loaded, total }));
      jarCache.set(version.id, h);
      setHandle(h);
      const groups = Object.keys(h.groups);
      setGroup(groups.includes("block") ? "block" : groups[0]);
    } catch (e: any) { setErr(e.message || "Download failed."); }
    finally { setBusy(false); setProgress(null); }
  };

  const groups = handle ? Object.keys(handle.groups).sort() : [];
  const filtered = useMemo(() => {
    if (!handle) return [];
    const ql = q.toLowerCase();
    return handle.entries
      .filter((e) => e.group === group && (!ql || e.mcPath.toLowerCase().includes(ql)))
      .slice(0, 1200);
  }, [handle, group, q]);

  const addOne = async (e: Entry) => {
    if (!handle) return;
    try { s.addTexture(await decodeEntry(handle, e)); } catch { /* skip */ }
  };

  const addAllShown = async () => {
    if (!handle || !filtered.length) return;
    setAddingAll(`0 / ${filtered.length}`);
    const out = [];
    for (let i = 0; i < filtered.length; i++) {
      try { out.push(await decodeEntry(handle, filtered[i])); } catch { /* skip */ }
      if (i % 20 === 0) setAddingAll(`${i} / ${filtered.length}`);
    }
    s.addTextures(out);
    setAddingAll("");
  };

  if (!handle) {
    const pct = progress && progress.total ? Math.round((progress.loaded / progress.total) * 100) : 0;
    return (
      <div className="grid h-full place-items-center p-6">
        <div className="max-w-md text-center">
          <Boxes size={40} className="mx-auto mb-3 text-accent" />
          <h3 className="mb-1 text-lg font-semibold">Load every vanilla texture</h3>
          <p className="mb-4 text-sm text-neutral-400">
            Downloads the official Minecraft <span className="font-mono">{version.id}</span> client from Mojang
            (~38&nbsp;MB) right here in your browser, then lets you browse and drop any block, item, or entity
            texture into your pack. Nothing is uploaded; nothing copyrighted is stored in this project.
          </p>
          {!busy ? (
            <button onClick={load} className="btn btn-accent mx-auto"><Download size={15} /> Load {version.id} textures</button>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2 text-sm text-accent"><Loader2 size={15} className="animate-spin" /> Downloading… {pct}%</div>
              <div className="h-1.5 w-full overflow-hidden rounded bg-ink-700"><div className="h-full bg-accent-soft transition-all" style={{ width: `${pct}%` }} /></div>
            </div>
          )}
          {err && <div className="mt-3 text-xs text-red-400">{err}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center gap-2 border-b border-line bg-ink-900 px-3 py-2">
        <select value={group} onChange={(e) => setGroup(e.target.value)}
          className="rounded-md border border-line bg-ink-850 px-2 py-1 text-sm capitalize outline-none focus:border-accent-dim">
          {groups.map((g) => <option key={g} value={g}>{g} ({handle.groups[g]})</option>)}
        </select>
        <div className="relative">
          <Search size={13} className="absolute left-2 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…"
            className="w-52 rounded-md border border-line bg-ink-850 py-1 pl-7 pr-2 text-sm outline-none focus:border-accent-dim" />
        </div>
        <span className="text-xs text-neutral-500">{filtered.length}{filtered.length === 1200 ? "+" : ""} shown</span>
        <button onClick={addAllShown} disabled={!!addingAll} className="btn btn-soft ml-auto text-xs disabled:opacity-50">
          {addingAll ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
          {addingAll ? `Adding ${addingAll}` : "Add all shown"}
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(84px,1fr))] gap-2">
          {filtered.map((e) => (
            <TexCard key={e.full} entry={e} handle={handle} added={existing.has(e.mcPath)} onAdd={() => addOne(e)} />
          ))}
        </div>
        {!filtered.length && <div className="grid h-40 place-items-center text-sm text-neutral-600">No matches.</div>}
      </div>
    </div>
  );
}

function TexCard({ entry, handle, added, onAdd }: { entry: Entry; handle: JarHandle; added: boolean; onAdd: () => void }) {
  const ref = useRef<HTMLButtonElement>(null);
  const [url, setUrl] = useState<string>("");

  useEffect(() => {
    let objUrl = ""; let cancelled = false;
    const io = new IntersectionObserver((ents) => {
      if (ents[0]?.isIntersecting && !objUrl) {
        io.disconnect();
        handle.zip.file(entry.full)?.async("blob").then((b) => {
          if (cancelled) return;
          objUrl = URL.createObjectURL(b); setUrl(objUrl);
        });
      }
    }, { rootMargin: "200px" });
    if (ref.current) io.observe(ref.current);
    return () => { cancelled = true; io.disconnect(); if (objUrl) URL.revokeObjectURL(objUrl); };
  }, [entry.full, handle]);

  const name = entry.mcPath.split("/").pop()!;
  return (
    <button ref={ref} onClick={onAdd} title={`${entry.mcPath} — click to add`}
      className="group relative flex flex-col items-center gap-1 rounded-md border border-line bg-ink-850 p-1.5 text-center hover:border-accent-dim hover:bg-ink-800">
      <div className="checker grid h-14 w-14 place-items-center overflow-hidden rounded">
        {url
          ? <img src={url} alt={name} className="h-14 w-14" style={{ imageRendering: "pixelated", objectFit: "contain" }} />
          : <Loader2 size={14} className="animate-spin text-neutral-600" />}
      </div>
      <span className="w-full truncate text-[10px] text-neutral-400">{name}</span>
      <span className={`absolute right-1 top-1 grid h-4 w-4 place-items-center rounded-full ${added ? "bg-accent-soft text-ink-950" : "bg-ink-700 text-neutral-300 opacity-0 group-hover:opacity-100"}`}>
        {added ? <Check size={11} /> : <Plus size={11} />}
      </span>
    </button>
  );
}
