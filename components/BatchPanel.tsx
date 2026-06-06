"use client";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { frameToDataURL, applyTint, applyBrightness, applyContrast, applyHueShift, applyInvert, applyGrayscale, upscaleFrame, hexToRgba } from "@/lib/image";
import { Layers, CheckSquare, Square, Wand2, Sparkles } from "lucide-react";

type Op = "tint" | "brightness" | "contrast" | "hue" | "invert" | "grayscale" | "upscale";

export default function BatchPanel() {
  const s = useStore();
  const [op, setOp] = useState<Op>("tint");
  const [tintColor, setTintColor] = useState("#6ee7b7");
  const [amount, setAmount] = useState(40);
  const [brightness, setBrightness] = useState(20);
  const [contrast, setContrast] = useState(30);
  const [hue, setHue] = useState(40);
  const [factor, setFactor] = useState(2);
  const [done, setDone] = useState("");

  const sel = s.batchSelection;
  const textures = s.project.textures;
  const allSelected = sel.length === textures.length && textures.length > 0;

  const toggleAll = () => s.setBatchSelection(allSelected ? [] : textures.map((t) => t.id));

  const apply = () => {
    if (!sel.length) { alert("Select some textures first."); return; }
    let count = 0;
    for (const id of sel) {
      const t = textures.find((x) => x.id === id); if (!t) continue;
      s.pushHistory(id);
      if (op === "upscale") {
        const up = t.frames.map((f) => upscaleFrame(f, t.width, t.height, factor));
        s.replaceFrames(id, up.map((u) => u.frame), up[0].w, up[0].h);
      } else {
        const newFrames = t.frames.map((f) => {
          if (op === "tint") return applyTint(f, hexToRgba(tintColor).slice(0, 3) as [number, number, number], amount);
          if (op === "brightness") return applyBrightness(f, brightness);
          if (op === "contrast") return applyContrast(f, contrast);
          if (op === "hue") return applyHueShift(f, hue);
          if (op === "invert") return applyInvert(f);
          return applyGrayscale(f);
        });
        s.replaceFrames(id, newFrames);
      }
      count++;
    }
    s.commit();
    setDone(`Applied ${op} to ${count} texture${count > 1 ? "s" : ""}.`);
    setTimeout(() => setDone(""), 2500);
  };

  return (
    <div className="flex h-full">
      {/* selectable grid */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2 border-b border-line bg-ink-900 px-4 py-2.5">
          <Layers size={18} className="text-accent" />
          <h2 className="font-semibold">Batch Editor</h2>
          <span className="rounded bg-ink-700 px-1.5 py-0.5 text-[10px] text-accent">PREMIUM · FREE</span>
          <button onClick={toggleAll} className="btn btn-ghost ml-auto text-xs">
            {allSelected ? <CheckSquare size={14} /> : <Square size={14} />} {allSelected ? "Deselect all" : "Select all"}
          </button>
          <span className="text-xs text-neutral-400">{sel.length} selected</span>
        </div>
        <div className="grid flex-1 grid-cols-[repeat(auto-fill,minmax(84px,1fr))] content-start gap-2 overflow-y-auto p-4">
          {textures.map((t) => {
            const on = sel.includes(t.id);
            return (
              <button key={t.id} onClick={() => s.toggleBatch(t.id)}
                className={`group relative flex flex-col items-center gap-1 rounded-lg border p-2 transition-colors ${on ? "border-accent bg-ink-800" : "border-line hover:bg-ink-850"}`}>
                <img src={frameToDataURL(t.frames[0], t.width, t.height)} width={48} height={48} style={{ imageRendering: "pixelated" }} className="checker rounded" alt={t.name} />
                <span className="w-full truncate text-center text-[10px] text-neutral-400">{t.name}</span>
                {on && <CheckSquare size={14} className="absolute right-1 top-1 text-accent" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* controls */}
      <div className="flex w-72 shrink-0 flex-col gap-4 border-l border-line bg-ink-900 p-4">
        <div className="flex items-center gap-2"><Wand2 size={16} className="text-accent" /><span className="text-sm font-semibold">Operation</span></div>
        <div className="grid grid-cols-2 gap-1.5">
          {(["tint", "brightness", "contrast", "hue", "invert", "grayscale", "upscale"] as Op[]).map((o) => (
            <button key={o} onClick={() => setOp(o)}
              className={`rounded-md px-2 py-1.5 text-xs capitalize ${op === o ? "bg-accent-soft text-ink-950" : "bg-ink-800 text-neutral-300 hover:bg-ink-700"}`}>{o}</button>
          ))}
        </div>

        <div className="card space-y-3 p-3">
          {op === "tint" && (<>
            <label className="flex items-center justify-between text-xs"><span className="text-neutral-400">Color</span>
              <input type="color" value={tintColor} onChange={(e) => setTintColor(e.target.value)} className="h-7 w-12 rounded border border-line bg-transparent" /></label>
            <Slider label="Strength" v={amount} set={setAmount} min={0} max={100} unit="%" />
          </>)}
          {op === "brightness" && <Slider label="Delta" v={brightness} set={setBrightness} min={-100} max={100} />}
          {op === "contrast" && <Slider label="Amount" v={contrast} set={setContrast} min={-100} max={100} />}
          {op === "hue" && <Slider label="Hue shift" v={hue} set={setHue} min={0} max={360} unit="°" />}
          {op === "upscale" && (
            <div className="flex gap-1.5">{[2, 4, 8, 16, 32].map((f) => (
              <button key={f} onClick={() => setFactor(f)} className={`flex-1 rounded px-2 py-1 text-xs ${factor === f ? "bg-accent-soft text-ink-950" : "bg-ink-800 hover:bg-ink-700"}`}>{f}×</button>
            ))}</div>
          )}
          {(op === "invert" || op === "grayscale") && <p className="text-xs text-neutral-500">No settings — applies directly.</p>}
        </div>

        <button onClick={apply} className="btn btn-accent w-full"><Sparkles size={15} /> Apply to {sel.length || 0} texture{sel.length === 1 ? "" : "s"}</button>
        {done && <div className="rounded-md bg-emerald-500/10 px-3 py-2 text-center text-xs text-accent">{done}</div>}
        <p className="text-xs leading-relaxed text-neutral-500">Upscaling supports the full library up to 32× (premium-tier feature, unlocked). Operations skip transparent pixels and apply across every animation frame.</p>
      </div>
    </div>
  );
}

function Slider({ label, v, set, min, max, unit = "" }: { label: string; v: number; set: (n: number) => void; min: number; max: number; unit?: string }) {
  return (
    <label className="block text-xs">
      <div className="mb-1 flex justify-between"><span className="text-neutral-400">{label}</span><span>{v}{unit}</span></div>
      <input type="range" min={min} max={max} value={v} onChange={(e) => set(Number(e.target.value))} className="w-full" />
    </label>
  );
}
