"use client";
import { useStore } from "@/lib/store";
import { ToolId } from "@/lib/types";
import { Brush, Eraser, PaintBucket, Pipette, SunMedium, Undo2, Redo2, Grid3x3, ZoomIn, ZoomOut } from "lucide-react";

const tools: { id: ToolId; icon: any; label: string }[] = [
  { id: "brush", icon: Brush, label: "Brush (B)" },
  { id: "eraser", icon: Eraser, label: "Eraser (E)" },
  { id: "fill", icon: PaintBucket, label: "Fill (G)" },
  { id: "eyedropper", icon: Pipette, label: "Pick (I)" },
  { id: "shade", icon: SunMedium, label: "Shade (S)" },
];

export default function Toolbar() {
  const s = useStore();
  return (
    <div className="flex items-center gap-1 border-b border-line bg-ink-900 px-2 py-1.5">
      {tools.map(({ id, icon: Icon, label }) => (
        <button key={id} title={label} onClick={() => s.setTool(id)}
          className={`grid h-8 w-8 place-items-center rounded-md transition-colors ${s.tool === id ? "bg-accent-soft text-ink-950" : "text-neutral-300 hover:bg-ink-700"}`}>
          <Icon size={16} />
        </button>
      ))}
      <div className="mx-1 h-6 w-px bg-line" />
      <div className="flex items-center gap-1 px-1 text-xs text-neutral-400">
        Size
        <input type="range" min={1} max={6} value={s.brushSize} onChange={(e) => s.setBrushSize(Number(e.target.value))} className="w-20" />
        <span className="w-4 text-neutral-200">{s.brushSize}</span>
      </div>
      {s.tool === "shade" && (
        <div className="flex items-center gap-1 rounded-md bg-ink-850 px-2 py-1 text-xs">
          <select value={s.shadeMode} onChange={(e) => s.setShadeMode(e.target.value as any)} className="bg-transparent outline-none">
            <option value="lighten">Lighten</option>
            <option value="darken">Darken</option>
            <option value="tint">Tint</option>
          </select>
          <input type="range" min={5} max={100} value={s.shadeStrength} onChange={(e) => s.setShadeStrength(Number(e.target.value))} className="w-16" />
          <span className="w-6">{s.shadeStrength}%</span>
        </div>
      )}
      <div className="mx-1 h-6 w-px bg-line" />
      <button title="Undo (Ctrl+Z)" onClick={s.undo} className="grid h-8 w-8 place-items-center rounded-md text-neutral-300 hover:bg-ink-700"><Undo2 size={16} /></button>
      <button title="Redo (Ctrl+Y)" onClick={s.redo} className="grid h-8 w-8 place-items-center rounded-md text-neutral-300 hover:bg-ink-700"><Redo2 size={16} /></button>
      <button title="Toggle grid" onClick={s.toggleGrid} className={`grid h-8 w-8 place-items-center rounded-md ${s.showGrid ? "text-accent" : "text-neutral-400"} hover:bg-ink-700`}><Grid3x3 size={16} /></button>
      <div className="ml-auto flex items-center gap-1">
        <button onClick={() => s.setZoom(s.zoom - 4)} className="grid h-8 w-8 place-items-center rounded-md text-neutral-300 hover:bg-ink-700"><ZoomOut size={16} /></button>
        <span className="w-10 text-center text-xs text-neutral-400">{Math.round((s.zoom / 16) * 100)}%</span>
        <button onClick={() => s.setZoom(s.zoom + 4)} className="grid h-8 w-8 place-items-center rounded-md text-neutral-300 hover:bg-ink-700"><ZoomIn size={16} /></button>
      </div>
    </div>
  );
}
