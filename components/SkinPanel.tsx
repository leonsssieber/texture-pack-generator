"use client";
import { useEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { defaultSkin } from "@/lib/skin";
import { hexToRgba, fileToFrame } from "@/lib/image";
import SkinView3D from "./SkinView3D";
import { User, Upload, RotateCcw } from "lucide-react";

export default function SkinPanel() {
  const s = useStore();
  const skin = s.project.skin;
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (!skin) s.setSkin(defaultSkin()); }, [skin, s]);
  if (!skin) return <div className="grid h-full place-items-center text-neutral-500">Preparing skin…</div>;

  return (
    <div className="flex h-full">
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2 border-b border-line bg-ink-900 px-4 py-2.5">
          <User size={18} className="text-accent" /><h2 className="font-semibold">Skin Editor</h2>
          <div className="ml-auto flex items-center gap-2">
            <label className="flex items-center gap-2 text-xs text-neutral-400">Model
              <select value={skin.model} onChange={(e) => s.setSkin({ ...skin, model: e.target.value as any })} className="rounded border border-line bg-ink-850 px-2 py-1">
                <option value="wide">Wide (Steve-type)</option>
                <option value="slim">Slim (Alex-type)</option>
              </select>
            </label>
            <button onClick={() => fileRef.current?.click()} className="btn btn-soft text-xs"><Upload size={13} /> Import 64×64</button>
            <input ref={fileRef} type="file" accept="image/png" hidden onChange={async (e) => {
              const f = e.target.files?.[0]; if (!f) return;
              const { frame, w, h } = await fileToFrame(f);
              if (w !== 64 || h !== 64) { alert("Skin must be 64×64 PNG"); return; }
              s.setSkin({ ...skin, data: frame.data });
            }} />
            <button onClick={() => { if (confirm("Reset skin?")) s.setSkin(defaultSkin()); }} className="btn btn-ghost text-xs"><RotateCcw size={13} /></button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-auto bg-ink-950 p-6">
          <SkinFlatEditor />
        </div>
      </div>
      <div className="flex w-80 shrink-0 flex-col border-l border-line bg-ink-900">
        <div className="border-b border-line px-4 py-2.5 text-sm font-semibold">3D Preview</div>
        <div className="min-h-0 flex-1"><SkinView3D skin={skin} rev={s.rev} /></div>
        <div className="border-t border-line p-3 text-xs text-neutral-500">Drag to rotate. Exports as entity/{skin.model === "slim" ? "alex" : "steve"}.png in your pack.</div>
      </div>
    </div>
  );
}

function SkinFlatEditor() {
  const s = useStore();
  const skin = s.project.skin!;
  const ref = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const Z = 8;

  const redraw = () => {
    const c = ref.current; if (!c) return;
    c.width = 64 * Z; c.height = 64 * Z;
    const ctx = c.getContext("2d")!;
    const off = document.createElement("canvas"); off.width = 64; off.height = 64;
    off.getContext("2d")!.putImageData(new ImageData(new Uint8ClampedArray(skin.data), 64, 64), 0, 0);
    ctx.imageSmoothingEnabled = false;
    // checker bg
    ctx.fillStyle = "#131318"; ctx.fillRect(0, 0, c.width, c.height);
    ctx.drawImage(off, 0, 0, c.width, c.height);
    // region guides
    ctx.strokeStyle = "rgba(110,231,183,0.25)"; ctx.lineWidth = 1;
    const guides = [[0,0,32,16],[16,16,24,16],[0,16,16,16],[40,16,16,16],[32,48,16,16],[16,48,16,16]];
    guides.forEach(([x,y,w,h]) => ctx.strokeRect(x*Z, y*Z, w*Z, h*Z));
  };
  useEffect(redraw, [skin.data, s.rev]);

  const paint = (e: React.MouseEvent) => {
    const c = ref.current!; const r = c.getBoundingClientRect();
    const x = Math.floor(((e.clientX - r.left) / r.width) * 64);
    const y = Math.floor(((e.clientY - r.top) / r.height) * 64);
    if (x < 0 || y < 0 || x >= 64 || y >= 64) return;
    const erase = e.buttons === 2;
    const rgba = erase ? [0,0,0,0] : hexToRgba(s.color);
    const i = (y * 64 + x) * 4;
    const data = skin.data.slice();
    data[i] = rgba[0]; data[i+1] = rgba[1]; data[i+2] = rgba[2]; data[i+3] = rgba[3];
    s.setSkin({ ...skin, data });
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <canvas ref={ref}
        onMouseDown={(e) => { drawing.current = true; paint(e); }}
        onMouseMove={(e) => { if (drawing.current) paint(e); }}
        onMouseUp={() => (drawing.current = false)}
        onMouseLeave={() => (drawing.current = false)}
        onContextMenu={(e) => e.preventDefault()}
        className="rounded ring-1 ring-line" style={{ imageRendering: "pixelated", cursor: "crosshair", width: "min(512px, 80vh)" }} />
      <div className="flex items-center gap-3">
        <input type="color" value={s.color} onChange={(e) => s.setColor(e.target.value)} className="h-8 w-12 rounded border border-line bg-transparent" />
        <div className="flex gap-1.5">{s.palette.slice(0, 10).map((c) => (
          <button key={c} onClick={() => s.setColor(c)} className="h-6 w-6 rounded border border-line" style={{ background: c }} />
        ))}</div>
        <span className="text-xs text-neutral-500">Left-click paint · right-click erase. Green outlines = UV regions.</span>
      </div>
    </div>
  );
}
