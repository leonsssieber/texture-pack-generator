"use client";
import { useRef, useEffect, useCallback, useState } from "react";
import { useStore } from "@/lib/store";
import { hexToRgba, setPixel, getPixel, floodFill, shadePixel, rgbaToHex, blitFrame } from "@/lib/image";

export default function PixelCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const lastCell = useRef<{ x: number; y: number } | null>(null);
  const [hover, setHover] = useState<{ x: number; y: number } | null>(null);
  const s = useStore();
  const tex = s.current();
  const frame = tex?.frames[Math.min(s.selectedFrame, (tex?.frames.length ?? 1) - 1)];

  const redraw = useCallback(() => {
    const c = ref.current; if (!c || !tex || !frame) return;
    const z = s.zoom;
    c.width = tex.width * z; c.height = tex.height * z;
    const ctx = c.getContext("2d")!;
    blitFrame(ctx, frame, tex.width, tex.height, z);
    if (s.showGrid && z >= 8) {
      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.lineWidth = 1;
      for (let x = 0; x <= tex.width; x++) { ctx.beginPath(); ctx.moveTo(x * z, 0); ctx.lineTo(x * z, c.height); ctx.stroke(); }
      for (let y = 0; y <= tex.height; y++) { ctx.beginPath(); ctx.moveTo(0, y * z); ctx.lineTo(c.width, y * z); ctx.stroke(); }
    }
    if (hover) {
      ctx.strokeStyle = "rgba(110,231,183,0.9)";
      ctx.lineWidth = 2;
      ctx.strokeRect(hover.x * z + 1, hover.y * z + 1, z - 2, z - 2);
    }
  }, [tex, frame, s.zoom, s.showGrid, hover, s.rev]);

  useEffect(() => { redraw(); }, [redraw]);

  const cellFromEvent = (e: React.MouseEvent): { x: number; y: number } | null => {
    const c = ref.current; if (!c || !tex) return null;
    const r = c.getBoundingClientRect();
    const x = Math.floor(((e.clientX - r.left) / r.width) * tex.width);
    const y = Math.floor(((e.clientY - r.top) / r.height) * tex.height);
    if (x < 0 || y < 0 || x >= tex.width || y >= tex.height) return null;
    return { x, y };
  };

  const paintCell = (x: number, y: number, secondary: boolean) => {
    if (!tex || !frame) return;
    const col = secondary ? s.secondaryColor : s.color;
    const rgba = hexToRgba(col);
    const t = s.tool;
    const bs = s.brushSize;
    const stamp = (cx: number, cy: number, val: [number, number, number, number]) => {
      const half = Math.floor(bs / 2);
      for (let dy = 0; dy < bs; dy++) for (let dx = 0; dx < bs; dx++) {
        const px = cx - half + dx, py = cy - half + dy;
        if (px >= 0 && py >= 0 && px < tex.width && py < tex.height) setPixel(frame, tex.width, px, py, val);
      }
    };
    if (t === "brush") stamp(x, y, rgba);
    else if (t === "eraser") stamp(x, y, [0, 0, 0, 0]);
    else if (t === "fill") floodFill(frame, tex.width, tex.height, x, y, rgba);
    else if (t === "shade") {
      const half = Math.floor(bs / 2);
      for (let dy = 0; dy < bs; dy++) for (let dx = 0; dx < bs; dx++) {
        const px = x - half + dx, py = y - half + dy;
        if (px >= 0 && py >= 0 && px < tex.width && py < tex.height)
          shadePixel(frame, tex.width, px, py, s.shadeMode, s.shadeStrength, hexToRgba(s.color).slice(0, 3) as [number, number, number]);
      }
    }
  };

  const onDown = (e: React.MouseEvent) => {
    if (!tex) return;
    const cell = cellFromEvent(e); if (!cell) return;
    if (s.tool === "eyedropper") {
      const p = getPixel(frame!, tex.width, cell.x, cell.y);
      if (p[3] > 0) { const hex = rgbaToHex(p[0], p[1], p[2]); s.setColor(hex); s.addPaletteColor(hex); }
      return;
    }
    s.pushHistory(tex.id);
    drawing.current = true;
    lastCell.current = cell;
    paintCell(cell.x, cell.y, e.button === 2);
    s.bump();
  };

  const onMove = (e: React.MouseEvent) => {
    const cell = cellFromEvent(e);
    setHover(cell);
    if (!drawing.current || !cell || !tex) return;
    // interpolate between cells for smooth strokes
    const last = lastCell.current;
    if (last && (s.tool === "brush" || s.tool === "eraser" || s.tool === "shade")) {
      const dx = cell.x - last.x, dy = cell.y - last.y;
      const steps = Math.max(Math.abs(dx), Math.abs(dy));
      for (let i = 1; i <= steps; i++) paintCell(Math.round(last.x + (dx * i) / steps), Math.round(last.y + (dy * i) / steps), e.buttons === 2);
    } else {
      paintCell(cell.x, cell.y, e.buttons === 2);
    }
    lastCell.current = cell;
    s.bump();
  };

  const onUp = () => {
    if (drawing.current) { drawing.current = false; lastCell.current = null; s.commit(); }
  };

  if (!tex) return <div className="grid h-full place-items-center text-neutral-500">Select or add a texture to start.</div>;

  return (
    <div className="flex h-full items-center justify-center overflow-auto p-6">
      <div className="relative">
        <canvas
          ref={ref}
          onMouseDown={onDown}
          onMouseMove={onMove}
          onMouseUp={onUp}
          onMouseLeave={() => { setHover(null); onUp(); }}
          onContextMenu={(e) => e.preventDefault()}
          className="checker rounded-md ring-1 ring-line"
          style={{ imageRendering: "pixelated", cursor: "crosshair", maxWidth: "min(70vh, 100%)" }}
        />
        <div className="mt-2 text-center text-xs text-neutral-500">
          {tex.width}×{tex.height}px · {tex.frames.length > 1 ? `frame ${s.selectedFrame + 1}/${tex.frames.length}` : "static"} · left=draw, right=erase color
        </div>
      </div>
    </div>
  );
}
