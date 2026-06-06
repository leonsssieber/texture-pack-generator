"use client";
import { useStore } from "@/lib/store";
import { Plus } from "lucide-react";

export default function Palette() {
  const s = useStore();
  return (
    <div className="border-t border-line bg-ink-900 p-3">
      <div className="mb-2 flex items-center gap-3">
        <label className="flex items-center gap-2 text-xs text-neutral-400">
          <span>Primary</span>
          <input type="color" value={s.color} onChange={(e) => s.setColor(e.target.value)}
            className="h-8 w-10 cursor-pointer rounded border border-line bg-transparent" />
        </label>
        <label className="flex items-center gap-2 text-xs text-neutral-400">
          <span>Alt</span>
          <input type="color" value={s.secondaryColor} onChange={(e) => s.setSecondary(e.target.value)}
            className="h-8 w-10 cursor-pointer rounded border border-line bg-transparent" />
        </label>
        <button onClick={() => s.addPaletteColor(s.color)} className="btn btn-ghost ml-auto text-xs"><Plus size={13} /> Save swatch</button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {s.palette.map((c) => (
          <button key={c} onClick={() => s.setColor(c)} onContextMenu={(e) => { e.preventDefault(); s.setSecondary(c); }}
            title={c} className={`h-6 w-6 rounded border ${s.color === c ? "border-accent" : "border-line"}`}
            style={{ background: c }} />
        ))}
      </div>
    </div>
  );
}
