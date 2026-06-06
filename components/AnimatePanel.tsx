"use client";
import { useRef, useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import { decodeGif } from "@/lib/gif";
import { frameToDataURL, cloneFrame, uid } from "@/lib/image";
import { Frame } from "@/lib/types";
import TextureList from "./TextureList";
import { Film, Plus, Copy, Trash2, Play, Pause, Upload } from "lucide-react";

export default function AnimatePanel() {
  const s = useStore();
  const t = s.current();
  const fileRef = useRef<HTMLInputElement>(null);
  const [playing, setPlaying] = useState(false);
  const [previewIdx, setPreviewIdx] = useState(0);
  const [busy, setBusy] = useState("");

  useEffect(() => {
    if (!playing || !t || t.frames.length < 2) return;
    const iv = setInterval(() => setPreviewIdx((i) => (i + 1) % t.frames.length), (t.frametime * 50));
    return () => clearInterval(iv);
  }, [playing, t?.frames.length, t?.frametime, t?.id]);

  const importGif = async (file: File) => {
    if (!t) return;
    setBusy("Decoding GIF…");
    try {
      const { frames, w, h, delays } = await decodeGif(file);
      // Resize frames to texture width (square tile = width). Downscale to t.width if larger.
      const target = t.width;
      const resized: Frame[] = frames.map((f) => resizeFrame(f, w, h, target, target));
      const avgDelay = Math.round(delays.reduce((a, b) => a + b, 0) / delays.length);
      s.replaceFrames(t.id, resized, target, target);
      s.updateTextureMeta(t.id, { frametime: Math.max(1, Math.round(avgDelay / 50)) });
    } catch (e: any) {
      alert("GIF import failed: " + e.message);
    } finally { setBusy(""); }
  };

  const importFramesFromImages = async (files: FileList) => {
    if (!t) return;
    const { fileToFrame } = await import("@/lib/image");
    const frames: Frame[] = [];
    for (const file of Array.from(files)) {
      const { frame, w, h } = await fileToFrame(file);
      frames.push(resizeFrame(frame, w, h, t.width, t.height));
    }
    if (frames.length) s.replaceFrames(t.id, frames);
  };

  if (!t) return (
    <div className="flex h-full">
      <TextureList />
      <div className="grid flex-1 place-items-center text-neutral-500">Select a texture to animate.</div>
    </div>
  );

  return (
    <div className="flex h-full">
      <TextureList />
      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto p-6">
        <div className="mb-4 flex items-center gap-2">
          <Film size={18} className="text-accent" />
          <h2 className="text-lg font-semibold">Animation — {t.name}</h2>
        </div>

        <div className="flex flex-wrap gap-6">
          <div className="card flex flex-col items-center gap-3 p-5">
            <div className="text-xs uppercase tracking-wide text-neutral-500">Live preview</div>
            <img
              src={frameToDataURL(t.frames[Math.min(previewIdx, t.frames.length - 1)], t.width, t.height)}
              width={160} height={160} style={{ imageRendering: "pixelated" }} className="checker rounded ring-1 ring-line" alt="preview" />
            <button onClick={() => setPlaying((p) => !p)} className="btn btn-soft text-sm">
              {playing ? <><Pause size={14} /> Pause</> : <><Play size={14} /> Play</>}
            </button>
          </div>

          <div className="card flex-1 p-5">
            <div className="mb-3 text-xs uppercase tracking-wide text-neutral-500">Settings</div>
            <label className="mb-3 flex items-center gap-3 text-sm">
              <span className="w-28 text-neutral-400">Frame time</span>
              <input type="range" min={1} max={40} value={t.frametime} onChange={(e) => s.updateTextureMeta(t.id, { frametime: Number(e.target.value) })} className="flex-1" />
              <span className="w-20 text-right">{t.frametime} ticks ({(t.frametime * 50)}ms)</span>
            </label>
            <label className="flex items-center gap-3 text-sm">
              <span className="w-28 text-neutral-400">Interpolate</span>
              <input type="checkbox" checked={t.interpolate} onChange={(e) => s.updateTextureMeta(t.id, { interpolate: e.target.checked })} className="h-4 w-4 accent-emerald-400" />
              <span className="text-xs text-neutral-500">Smoothly blend between frames (Java)</span>
            </label>
            <div className="mt-4 flex flex-wrap gap-2">
              <button onClick={s.addFrame} className="btn btn-soft text-sm"><Plus size={14} /> Add frame</button>
              <button onClick={() => fileRef.current?.click()} className="btn btn-accent text-sm"><Upload size={14} /> Import GIF / frames</button>
              <input ref={fileRef} type="file" hidden accept="image/*"
                onChange={(e) => { const f = e.target.files; if (!f?.length) return; if (f[0].type === "image/gif" && f.length === 1) importGif(f[0]); else importFramesFromImages(f); }} multiple />
              {busy && <span className="self-center text-xs text-accent">{busy}</span>}
            </div>
            <p className="mt-3 text-xs text-neutral-500">Drop a GIF to auto-split into frames (free — no size cap, full detail up to your tile size). Or select multiple PNGs as frames.</p>
          </div>
        </div>

        <div className="mt-6">
          <div className="mb-2 text-xs uppercase tracking-wide text-neutral-500">Frames ({t.frames.length})</div>
          <div className="flex flex-wrap gap-2">
            {t.frames.map((f, i) => (
              <div key={i} className={`group relative rounded-md p-1 ring-1 ${s.selectedFrame === i ? "ring-accent" : "ring-line"}`}>
                <img onClick={() => s.setFrame(i)} src={frameToDataURL(f, t.width, t.height)} width={56} height={56}
                  style={{ imageRendering: "pixelated" }} className="checker cursor-pointer rounded" alt={`frame ${i}`} />
                <div className="absolute left-1 top-1 rounded bg-black/60 px-1 text-[9px]">{i + 1}</div>
                <div className="absolute bottom-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100">
                  <button onClick={() => { s.setFrame(i); s.duplicateFrame(); }} className="rounded bg-black/70 p-0.5 hover:text-accent"><Copy size={11} /></button>
                  <button onClick={() => { s.setFrame(i); s.deleteFrame(); }} className="rounded bg-black/70 p-0.5 hover:text-red-400"><Trash2 size={11} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function resizeFrame(f: Frame, w: number, h: number, tw: number, th: number): Frame {
  if (w === tw && h === th) return cloneFrame(f);
  const src = document.createElement("canvas"); src.width = w; src.height = h;
  src.getContext("2d")!.putImageData(new ImageData(new Uint8ClampedArray(f.data), w, h), 0, 0);
  const dst = document.createElement("canvas"); dst.width = tw; dst.height = th;
  const ctx = dst.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(src, 0, 0, tw, th);
  return { data: Array.from(ctx.getImageData(0, 0, tw, th).data) };
}
