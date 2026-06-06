"use client";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { exportJava, exportBedrock, downloadBlob } from "@/lib/export";
import { Download, Package, FileJson } from "lucide-react";

export default function ExportPanel() {
  const s = useStore();
  const p = s.project;
  const [busy, setBusy] = useState("");

  const doExport = async (edition: "java" | "bedrock") => {
    setBusy(`Building ${edition} pack…`);
    try {
      const safe = p.name.replace(/[^a-z0-9_-]+/gi, "_") || "pack";
      if (edition === "java") downloadBlob(await exportJava(p), `${safe}_java.zip`);
      else downloadBlob(await exportBedrock(p), `${safe}_bedrock.mcpack`);
    } catch (e: any) { alert("Export failed: " + e.message); }
    finally { setBusy(""); }
  };

  return (
    <div className="mx-auto flex h-full max-w-3xl flex-col p-8">
      <div className="mb-6 flex items-center gap-2">
        <Download size={20} className="text-accent" />
        <h2 className="text-xl font-semibold">Export Pack</h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <button onClick={() => doExport("java")} disabled={!!busy}
          className="card group flex flex-col items-start gap-2 p-5 text-left transition-colors hover:border-accent-dim disabled:opacity-50">
          <div className="flex items-center gap-2"><Package size={18} className="text-accent" /><span className="font-semibold">Java Edition</span></div>
          <p className="text-sm text-neutral-400">.zip with pack.mcmeta, assets/minecraft/textures, animation .mcmeta files, and sounds.json.</p>
          <span className="mt-2 rounded bg-ink-700 px-2 py-1 text-xs">pack_format {p.packFormat}</span>
        </button>

        <button onClick={() => doExport("bedrock")} disabled={!!busy}
          className="card group flex flex-col items-start gap-2 p-5 text-left transition-colors hover:border-accent-dim disabled:opacity-50">
          <div className="flex items-center gap-2"><FileJson size={18} className="text-accent" /><span className="font-semibold">Bedrock Edition</span></div>
          <p className="text-sm text-neutral-400">.mcpack with manifest.json, textures, and flipbook_textures.json for animations.</p>
          <span className="mt-2 rounded bg-ink-700 px-2 py-1 text-xs">format_version 2</span>
        </button>
      </div>

      {busy && <div className="mt-4 rounded-md bg-emerald-500/10 px-4 py-2 text-center text-sm text-accent">{busy}</div>}

      <div className="card mt-6 p-5">
        <div className="mb-3 text-sm font-semibold">Pack contents</div>
        <dl className="grid grid-cols-2 gap-y-2 text-sm">
          <dt className="text-neutral-400">Textures</dt><dd>{p.textures.length}</dd>
          <dt className="text-neutral-400">Animated</dt><dd>{p.textures.filter((t) => t.frames.length > 1).length}</dd>
          <dt className="text-neutral-400">Sounds</dt><dd>{p.sounds.length}</dd>
          <dt className="text-neutral-400">Custom skin</dt><dd>{p.skin ? "Yes" : "No"}</dd>
        </dl>
      </div>

      <p className="mt-6 text-xs leading-relaxed text-neutral-500">
        Java: unzip nothing — drop the .zip straight into <span className="font-mono">.minecraft/resourcepacks</span>.
        Bedrock: open the .mcpack file and Minecraft imports it automatically. Everything is generated locally in your browser — nothing is uploaded.
      </p>
    </div>
  );
}
