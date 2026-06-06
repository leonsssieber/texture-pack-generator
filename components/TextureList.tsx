"use client";
import { useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { fileToFrame, frameToDataURL, uid, emptyFrame } from "@/lib/image";
import { Texture } from "@/lib/types";
import { Plus, Upload, Trash2, Search, Package, Boxes } from "lucide-react";
import JarImport from "./JarImport";

function Thumb({ t }: { t: Texture }) {
  const url = frameToDataURL(t.frames[0], t.width, t.height);
  return <img src={url} width={28} height={28} style={{ imageRendering: "pixelated" }} className="checker rounded" alt={t.name} />;
}

export default function TextureList() {
  const s = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [adding, setAdding] = useState(false);
  const [showJar, setShowJar] = useState(false);

  const onUpload = async (files: FileList | null) => {
    if (!files) return;
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) continue;
      const { frame, w, h } = await fileToFrame(file);
      const base = file.name.replace(/\.[^.]+$/, "");
      s.addTexture({ id: uid(), name: base, category: "custom", mcPath: `custom/${base}`, width: w, height: h, frames: [frame], frametime: 2, interpolate: false });
    }
  };

  const addBlank = (size: number) => {
    const name = `texture_${s.project.textures.length + 1}`;
    s.addTexture({ id: uid(), name, category: "custom", mcPath: `custom/${name}`, width: size, height: size, frames: [emptyFrame(size, size)], frametime: 2, interpolate: false });
    setAdding(false);
  };

  const categories = ["all", ...Array.from(new Set(s.project.textures.map((t) => t.category))).sort()];
  const list = s.project.textures.filter((t) =>
    (cat === "all" || t.category === cat) &&
    (t.name.toLowerCase().includes(q.toLowerCase()) || t.mcPath.toLowerCase().includes(q.toLowerCase())));

  return (
    <div className="flex h-full w-60 shrink-0 flex-col border-r border-line bg-ink-900">
      <div className="flex items-center gap-1 border-b border-line p-2">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-2 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…"
            className="w-full rounded-md border border-line bg-ink-850 py-1 pl-7 pr-2 text-xs outline-none focus:border-accent-dim" />
        </div>
      </div>
      {categories.length > 2 && (
        <div className="border-b border-line px-2 py-1.5">
          <select value={cat} onChange={(e) => setCat(e.target.value)}
            className="w-full rounded-md border border-line bg-ink-850 px-2 py-1 text-xs capitalize outline-none focus:border-accent-dim">
            {categories.map((c) => <option key={c} value={c}>{c === "all" ? "All categories" : c}</option>)}
          </select>
        </div>
      )}
      <div className="flex gap-1 border-b border-line p-2">
        <button onClick={() => setAdding((v) => !v)} className="btn btn-soft flex-1 text-xs"><Plus size={13} /> New</button>
        <button onClick={() => fileRef.current?.click()} className="btn btn-soft flex-1 text-xs"><Upload size={13} /> Upload</button>
        <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => onUpload(e.target.files)} />
      </div>
      <div className="flex gap-1 border-b border-line p-2">
        <button onClick={() => s.setPanel("vanilla")} className="btn btn-accent flex-1 text-xs"><Boxes size={13} /> Vanilla assets</button>
        <button onClick={() => setShowJar(true)} title="Import from a local .jar instead" className="btn btn-soft text-xs"><Package size={13} /></button>
      </div>
      {showJar && <JarImport onClose={() => setShowJar(false)} />}
      {adding && (
        <div className="flex flex-wrap gap-1 border-b border-line bg-ink-850 p-2">
          {[8, 16, 32, 64, 128].map((sz) => (
            <button key={sz} onClick={() => addBlank(sz)} className="rounded bg-ink-700 px-2 py-1 text-xs hover:bg-ink-600">{sz}²</button>
          ))}
        </div>
      )}
      <div className="min-h-0 flex-1 overflow-y-auto p-1.5">
        {list.map((t) => (
          <div key={t.id}
            onClick={() => s.select(t.id)}
            className={`group flex cursor-pointer items-center gap-2 rounded-md p-1.5 ${s.selectedId === t.id ? "bg-ink-700 ring-1 ring-accent-dim" : "hover:bg-ink-850"}`}>
            <Thumb t={t} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-medium">{t.name}</div>
              <div className="truncate text-[10px] text-neutral-500">{t.mcPath}</div>
            </div>
            {t.frames.length > 1 && <span className="rounded bg-ink-600 px-1 text-[9px] text-accent">{t.frames.length}f</span>}
            <button onClick={(e) => { e.stopPropagation(); if (confirm(`Delete ${t.name}?`)) s.removeTexture(t.id); }}
              className="opacity-0 group-hover:opacity-100 text-neutral-500 hover:text-red-400"><Trash2 size={13} /></button>
          </div>
        ))}
        {!list.length && <div className="p-4 text-center text-xs text-neutral-600">No textures</div>}
      </div>
    </div>
  );
}
