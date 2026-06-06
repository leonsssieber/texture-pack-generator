import { parseGIF, decompressFrames } from "gifuct-js";
import { Frame } from "./types";

// Decode a GIF File into frames (RGBA), composited correctly.
export async function decodeGif(file: File): Promise<{ frames: Frame[]; w: number; h: number; delays: number[] }> {
  const buf = await file.arrayBuffer();
  const gif = parseGIF(buf);
  const parsed = decompressFrames(gif, true);
  if (!parsed.length) throw new Error("No frames in GIF");
  const w = gif.lsd.width, h = gif.lsd.height;
  const frames: Frame[] = [];
  const delays: number[] = [];

  const composite = document.createElement("canvas");
  composite.width = w; composite.height = h;
  const cctx = composite.getContext("2d")!;
  const patch = document.createElement("canvas");
  const pctx = patch.getContext("2d")!;

  for (const fr of parsed) {
    const { width, height, left, top } = fr.dims;
    patch.width = width; patch.height = height;
    const imgData = new ImageData(new Uint8ClampedArray(fr.patch), width, height);
    pctx.putImageData(imgData, 0, 0);
    if (fr.disposalType === 2) cctx.clearRect(0, 0, w, h);
    cctx.drawImage(patch, left, top);
    const full = cctx.getImageData(0, 0, w, h);
    frames.push({ data: Array.from(full.data) });
    delays.push(fr.delay || 100);
  }
  return { frames, w, h, delays };
}
