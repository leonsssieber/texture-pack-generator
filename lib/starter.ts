import { Texture, Frame } from "./types";
import { uid } from "./image";

// Procedurally generate a few neutral starter textures so the editor isn't empty.
// These are ORIGINAL generated graphics, not Minecraft assets.
function gen(w: number, h: number, fn: (x: number, y: number) => [number, number, number, number]): Frame {
  const data = new Array(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4;
    const [r, g, b, a] = fn(x, y);
    data[i] = r; data[i + 1] = g; data[i + 2] = b; data[i + 3] = a;
  }
  return { data };
}

function noise(base: [number, number, number], jitter: number) {
  return (x: number, y: number): [number, number, number, number] => {
    const n = (Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1;
    const d = (Math.abs(n) - 0.5) * jitter;
    return [
      Math.max(0, Math.min(255, base[0] + d)),
      Math.max(0, Math.min(255, base[1] + d)),
      Math.max(0, Math.min(255, base[2] + d)),
      255,
    ];
  };
}

function tex(name: string, category: string, mcPath: string, frame: Frame, size = 16): Texture {
  return { id: uid(), name, category, mcPath, width: size, height: size, frames: [frame], frametime: 2, interpolate: false };
}

export function starterTextures(): Texture[] {
  return [
    tex("stone", "block", "block/stone", gen(16, 16, noise([128, 128, 128], 40))),
    tex("dirt", "block", "block/dirt", gen(16, 16, noise([134, 96, 67], 36))),
    tex("planks", "block", "block/oak_planks", gen(16, 16, (x, y) => {
      const plank = Math.floor(y / 4) % 2;
      const base = plank ? 170 : 150;
      const grain = (x * 7 + y * 3) % 9 < 2 ? -18 : 0;
      return [base + grain, Math.round((base + grain) * 0.72), Math.round((base + grain) * 0.42), 255];
    })),
    tex("sand", "block", "block/sand", gen(16, 16, noise([219, 207, 163], 22))),
    tex("blank16", "custom", "custom/blank16", gen(16, 16, () => [0, 0, 0, 0])),
    tex("apple", "item", "item/apple", gen(16, 16, (x, y) => {
      const cx = 8, cy = 9, r = 5;
      const d = Math.hypot(x - cx, y - cy);
      if (x === 8 && y >= 2 && y <= 4) return [90, 60, 30, 255];
      if (d <= r) return [200 - d * 8, 30, 30, 255];
      return [0, 0, 0, 0];
    })),
  ];
}
