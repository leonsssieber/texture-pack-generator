import { Frame, Texture } from "./types";

export function emptyFrame(w: number, h: number): Frame {
  return { data: new Array(w * h * 4).fill(0) };
}

export function cloneFrame(f: Frame): Frame {
  return { data: f.data.slice() };
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export function frameToImageData(f: Frame, w: number, h: number): ImageData {
  return new ImageData(new Uint8ClampedArray(f.data), w, h);
}

// Draw a frame to a canvas context, scaled, nearest-neighbour
export function blitFrame(ctx: CanvasRenderingContext2D, f: Frame, w: number, h: number, scale: number) {
  const off = document.createElement("canvas");
  off.width = w; off.height = h;
  const octx = off.getContext("2d")!;
  octx.putImageData(frameToImageData(f, w, h), 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, w * scale, h * scale);
  ctx.drawImage(off, 0, 0, w * scale, h * scale);
}

export function frameToDataURL(f: Frame, w: number, h: number): string {
  const off = document.createElement("canvas");
  off.width = w; off.height = h;
  const octx = off.getContext("2d")!;
  octx.putImageData(frameToImageData(f, w, h), 0, 0);
  return off.toDataURL("image/png");
}

// Compose all animation frames vertically into one tall PNG (Minecraft strip format)
export function textureToStripBlob(t: Texture): Promise<Blob> {
  const off = document.createElement("canvas");
  off.width = t.width;
  off.height = t.height * t.frames.length;
  const octx = off.getContext("2d")!;
  t.frames.forEach((f, i) => {
    octx.putImageData(frameToImageData(f, t.width, t.height), 0, i * t.height);
  });
  return new Promise((res) => off.toBlob((b) => res(b!), "image/png"));
}

export function hexToRgba(hex: string, a = 255): [number, number, number, number] {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16), a];
}

export function rgbaToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
}

// ---- pixel ops on a frame ----
export function getPixel(f: Frame, w: number, x: number, y: number): [number, number, number, number] {
  const i = (y * w + x) * 4;
  return [f.data[i], f.data[i + 1], f.data[i + 2], f.data[i + 3]];
}

export function setPixel(f: Frame, w: number, x: number, y: number, rgba: [number, number, number, number]) {
  const i = (y * w + x) * 4;
  f.data[i] = rgba[0]; f.data[i + 1] = rgba[1]; f.data[i + 2] = rgba[2]; f.data[i + 3] = rgba[3];
}

export function floodFill(f: Frame, w: number, h: number, x: number, y: number, fill: [number, number, number, number]) {
  const target = getPixel(f, w, x, y);
  if (target[0] === fill[0] && target[1] === fill[1] && target[2] === fill[2] && target[3] === fill[3]) return;
  const stack = [[x, y]];
  const match = (px: number, py: number) => {
    const p = getPixel(f, w, px, py);
    return p[0] === target[0] && p[1] === target[1] && p[2] === target[2] && p[3] === target[3];
  };
  while (stack.length) {
    const [cx, cy] = stack.pop()!;
    if (cx < 0 || cy < 0 || cx >= w || cy >= h) continue;
    if (!match(cx, cy)) continue;
    setPixel(f, w, cx, cy, fill);
    stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
  }
}

export function shadePixel(f: Frame, w: number, x: number, y: number, mode: string, strength: number, tint: [number, number, number]) {
  const [r, g, b, a] = getPixel(f, w, x, y);
  if (a === 0) return; // skip transparent
  const s = strength / 100;
  let nr = r, ng = g, nb = b;
  if (mode === "lighten") { nr = r + (255 - r) * s; ng = g + (255 - g) * s; nb = b + (255 - b) * s; }
  else if (mode === "darken") { nr = r * (1 - s); ng = g * (1 - s); nb = b * (1 - s); }
  else { nr = r + (tint[0] - r) * s; ng = g + (tint[1] - g) * s; nb = b + (tint[2] - b) * s; }
  setPixel(f, w, x, y, [Math.round(nr), Math.round(ng), Math.round(nb), a]);
}

// ---- batch transforms (return NEW frame) ----
export function applyTint(f: Frame, color: [number, number, number], amount: number): Frame {
  const out = cloneFrame(f);
  const s = amount / 100;
  for (let i = 0; i < out.data.length; i += 4) {
    if (out.data[i + 3] === 0) continue;
    out.data[i] = Math.round(out.data[i] + (color[0] - out.data[i]) * s);
    out.data[i + 1] = Math.round(out.data[i + 1] + (color[1] - out.data[i + 1]) * s);
    out.data[i + 2] = Math.round(out.data[i + 2] + (color[2] - out.data[i + 2]) * s);
  }
  return out;
}

export function applyBrightness(f: Frame, delta: number): Frame {
  const out = cloneFrame(f);
  for (let i = 0; i < out.data.length; i += 4) {
    if (out.data[i + 3] === 0) continue;
    out.data[i] = clamp(out.data[i] + delta);
    out.data[i + 1] = clamp(out.data[i + 1] + delta);
    out.data[i + 2] = clamp(out.data[i + 2] + delta);
  }
  return out;
}

export function applyContrast(f: Frame, amount: number): Frame {
  const out = cloneFrame(f);
  const c = (259 * (amount + 255)) / (255 * (259 - amount));
  for (let i = 0; i < out.data.length; i += 4) {
    if (out.data[i + 3] === 0) continue;
    out.data[i] = clamp(c * (out.data[i] - 128) + 128);
    out.data[i + 1] = clamp(c * (out.data[i + 1] - 128) + 128);
    out.data[i + 2] = clamp(c * (out.data[i + 2] - 128) + 128);
  }
  return out;
}

export function applyHueShift(f: Frame, deg: number): Frame {
  const out = cloneFrame(f);
  for (let i = 0; i < out.data.length; i += 4) {
    if (out.data[i + 3] === 0) continue;
    const [h, s, l] = rgbToHsl(out.data[i], out.data[i + 1], out.data[i + 2]);
    const [r, g, b] = hslToRgb((h + deg / 360) % 1, s, l);
    out.data[i] = r; out.data[i + 1] = g; out.data[i + 2] = b;
  }
  return out;
}

export function applyInvert(f: Frame): Frame {
  const out = cloneFrame(f);
  for (let i = 0; i < out.data.length; i += 4) {
    if (out.data[i + 3] === 0) continue;
    out.data[i] = 255 - out.data[i];
    out.data[i + 1] = 255 - out.data[i + 1];
    out.data[i + 2] = 255 - out.data[i + 2];
  }
  return out;
}

export function applyGrayscale(f: Frame): Frame {
  const out = cloneFrame(f);
  for (let i = 0; i < out.data.length; i += 4) {
    if (out.data[i + 3] === 0) continue;
    const v = Math.round(0.299 * out.data[i] + 0.587 * out.data[i + 1] + 0.114 * out.data[i + 2]);
    out.data[i] = v; out.data[i + 1] = v; out.data[i + 2] = v;
  }
  return out;
}

// Nearest-neighbour upscale by integer factor
export function upscaleFrame(f: Frame, w: number, h: number, factor: number): { frame: Frame; w: number; h: number } {
  const nw = w * factor, nh = h * factor;
  const out = new Array(nw * nh * 4).fill(0);
  for (let y = 0; y < nh; y++) {
    for (let x = 0; x < nw; x++) {
      const sx = Math.floor(x / factor), sy = Math.floor(y / factor);
      const si = (sy * w + sx) * 4, di = (y * nw + x) * 4;
      out[di] = f.data[si]; out[di + 1] = f.data[si + 1]; out[di + 2] = f.data[si + 2]; out[di + 3] = f.data[si + 3];
    }
  }
  return { frame: { data: out }, w: nw, h: nh };
}

function clamp(v: number) { return Math.max(0, Math.min(255, Math.round(v))); }

export function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0; const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h /= 6;
  }
  return [h, s, l];
}

export function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  let r, g, b;
  if (s === 0) { r = g = b = l; }
  else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1; if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3); g = hue2rgb(p, q, h); b = hue2rgb(p, q, h - 1 / 3);
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

// Load an image File into a Frame at native size
export async function fileToFrame(file: File | Blob): Promise<{ frame: Frame; w: number; h: number }> {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    const c = document.createElement("canvas");
    c.width = img.width; c.height = img.height;
    const ctx = c.getContext("2d")!;
    ctx.drawImage(img, 0, 0);
    const id = ctx.getImageData(0, 0, img.width, img.height);
    return { frame: { data: Array.from(id.data) }, w: img.width, h: img.height };
  } finally { URL.revokeObjectURL(url); }
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = src;
  });
}
