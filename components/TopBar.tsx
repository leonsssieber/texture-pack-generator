"use client";
import { useStore } from "@/lib/store";
import { Boxes, Plus, RotateCcw } from "lucide-react";

export default function TopBar() {
  const { project, setProjectMeta, newProject } = useStore();
  return (
    <header className="flex h-12 shrink-0 items-center gap-3 border-b border-line bg-ink-900 px-3">
      <div className="flex items-center gap-2 pr-2">
        <div className="grid h-7 w-7 place-items-center rounded-md bg-accent-soft text-ink-950">
          <Boxes size={16} />
        </div>
        <span className="text-sm font-semibold tracking-tight">Texture Pack Generator</span>
        <span className="rounded bg-ink-700 px-1.5 py-0.5 text-[10px] font-medium text-accent">PREMIUM UNLOCKED</span>
      </div>

      <div className="ml-2 flex items-center gap-2">
        <input
          value={project.name}
          onChange={(e) => setProjectMeta({ name: e.target.value })}
          className="w-44 rounded-md border border-line bg-ink-850 px-2.5 py-1 text-sm outline-none focus:border-accent-dim"
        />
        <select
          value={project.edition}
          onChange={(e) => setProjectMeta({ edition: e.target.value as "java" | "bedrock" })}
          className="rounded-md border border-line bg-ink-850 px-2 py-1 text-sm outline-none"
        >
          <option value="java">Java</option>
          <option value="bedrock">Bedrock</option>
        </select>
        <select
          value={project.packFormat}
          onChange={(e) => setProjectMeta({ packFormat: Number(e.target.value) })}
          className="rounded-md border border-line bg-ink-850 px-2 py-1 text-sm outline-none"
          title="Pack format"
        >
          {[
            [34, "1.21.4+"], [22, "1.20.2"], [15, "1.20"], [12, "1.19"], [9, "1.18"], [7, "1.17"], [6, "1.16"], [4, "1.13"],
          ].map(([v, label]) => <option key={v} value={v}>{`fmt ${v} · ${label}`}</option>)}
        </select>
      </div>

      <div className="ml-auto flex items-center gap-2 text-xs text-neutral-400">
        <span>{project.textures.length} textures · {project.sounds.length} sounds</span>
        <button
          onClick={() => { if (confirm("Start a new project? This clears the current one.")) newProject(); }}
          className="btn btn-ghost"
          title="New project"
        >
          <RotateCcw size={14} /> New
        </button>
      </div>
    </header>
  );
}
