import JSZip from "jszip";
import { Frame, Texture } from "./types";
import { uid, fileToFrame } from "./image";

const TEX_RE = /^assets\/minecraft\/textures\/(.+)\.png$/;

export interface JarHandle {
  zip: JSZip;
  entries: { full: string; mcPath: string; group: string }[];
  groups: Record<string, number>;
}

// Phase 1: open the jar and index texture entries (no decoding yet).
export async function openJar(file: File): Promise<JarHandle> {
  const zip = await JSZip.loadAsync(file);
  const entries: JarHandle["entries"] = [];
  const groups: Record<string, number> = {};
  zip.forEach((path, entry) => {
    if (entry.dir) return;
    const m = path.match(TEX_RE);
    if (!m) return;
    const mcPath = m[1];                 // e.g. "block/stone"
    const group = mcPath.split("/")[0];  // e.g. "block"
    entries.push({ full: path, mcPath, group });
    groups[group] = (groups[group] || 0) + 1;
  });
  if (!entries.length) throw new Error("No assets/minecraft/textures found. Is this a Minecraft client .jar?");
  return { zip, entries, groups };
}

// Phase 2: decode the chosen groups into editable textures.
export async function importGroups(
  handle: JarHandle,
  groups: string[],
  onProgress?: (done: number, total: number) => void
): Promise<Texture[]> {
  const chosen = handle.entries.filter((e) => groups.includes(e.group));
  const out: Texture[] = [];
  let done = 0;
  for (const e of chosen) {
    try {
      const blob = await handle.zip.file(e.full)!.async("blob");
      const { frame, w, h } = await fileToFrame(blob);

      // animation strip detection via sibling .mcmeta
      let frames: Frame[] = [{ data: frame.data }];
      let tw = w, th = h, frametime = 2, interpolate = false;
      const meta = handle.zip.file(e.full + ".mcmeta");
      const isStrip = h > w && h % w === 0;
      if (meta && isStrip) {
        try {
          const mj = JSON.parse(await meta.async("string"));
          if (mj.animation) {
            const count = h / w;
            const per = w * w * 4;
            frames = [];
            for (let i = 0; i < count; i++) frames.push({ data: frame.data.slice(i * per, (i + 1) * per) });
            tw = w; th = w;
            frametime = mj.animation.frametime ?? 1;
            interpolate = !!mj.animation.interpolate;
          }
        } catch { /* ignore bad mcmeta */ }
      }

      const name = e.mcPath.split("/").pop()!;
      out.push({ id: uid(), name, category: e.group, mcPath: e.mcPath, width: tw, height: th, frames, frametime, interpolate });
    } catch { /* skip unreadable entry */ }
    done++;
    if (onProgress && done % 25 === 0) onProgress(done, chosen.length);
  }
  onProgress?.(chosen.length, chosen.length);
  return out;
}
