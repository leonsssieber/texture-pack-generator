import JSZip from "jszip";
import { Project, Texture } from "./types";
import { textureToStripBlob, frameToDataURL } from "./image";

function dataUrlToUint8(dataUrl: string): Uint8Array {
  const b64 = dataUrl.split(",")[1];
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return arr;
}

async function textureBlob(t: Texture): Promise<Blob> {
  if (t.frames.length > 1) return textureToStripBlob(t);
  return dataUrlToUint8(frameToDataURL(t.frames[0], t.width, t.height)) as unknown as Blob;
}

async function pngBytes(t: Texture): Promise<Uint8Array> {
  if (t.frames.length > 1) {
    const blob = await textureToStripBlob(t);
    return new Uint8Array(await blob.arrayBuffer());
  }
  return dataUrlToUint8(frameToDataURL(t.frames[0], t.width, t.height));
}

export async function exportJava(p: Project): Promise<Blob> {
  const zip = new JSZip();
  zip.file("pack.mcmeta", JSON.stringify({
    pack: { pack_format: p.packFormat, description: `${p.name} — made with Texture Pack Generator` },
  }, null, 2));

  const tex = zip.folder("assets")!.folder("minecraft")!.folder("textures")!;
  for (const t of p.textures) {
    const bytes = await pngBytes(t);
    tex.file(`${t.mcPath}.png`, bytes);
    if (t.frames.length > 1) {
      tex.file(`${t.mcPath}.png.mcmeta`, JSON.stringify({
        animation: { frametime: t.frametime, interpolate: t.interpolate },
      }, null, 2));
    }
  }

  // player skin -> entity/player
  if (p.skin) {
    const bytes = dataUrlToUint8(skinDataUrl(p.skin));
    tex.file(`entity/${p.skin.model === "slim" ? "alex" : "steve"}.png`, bytes);
  }

  // sounds
  if (p.sounds.length) {
    const minecraft = zip.folder("assets")!.folder("minecraft")!;
    const soundsFolder = minecraft.folder("sounds")!;
    const soundsJson: Record<string, { sounds: string[]; replace: boolean }> = {};
    for (const s of p.sounds) {
      const safe = s.name.replace(/[^a-z0-9_.-]/gi, "_").replace(/\.(ogg|mp3|wav)$/i, "");
      soundsFolder.file(`${safe}.ogg`, dataUrlToUint8(s.dataUrl));
      soundsJson[s.event] = { sounds: [safe], replace: true };
    }
    minecraft.file("sounds.json", JSON.stringify(soundsJson, null, 2));
  }

  return zip.generateAsync({ type: "blob" });
}

export async function exportBedrock(p: Project): Promise<Blob> {
  const zip = new JSZip();
  const uuid1 = crypto.randomUUID();
  const uuid2 = crypto.randomUUID();
  zip.file("manifest.json", JSON.stringify({
    format_version: 2,
    header: { name: p.name, description: `${p.name} — Texture Pack Generator`, uuid: uuid1, version: [1, 0, 0], min_engine_version: [1, 20, 0] },
    modules: [{ type: "resources", uuid: uuid2, version: [1, 0, 0] }],
  }, null, 2));

  const tex = zip.folder("textures")!;
  for (const t of p.textures) {
    // Bedrock uses first frame only for non-flipbook simplicity
    const bytes = dataUrlToUint8(frameToDataURL(t.frames[0], t.width, t.height));
    tex.file(`${t.mcPath}.png`, bytes);
  }

  // flipbook_textures.json for animated entries
  const flip = p.textures.filter((t) => t.frames.length > 1).map((t) => ({
    flipbook_texture: `textures/${t.mcPath}`,
    atlas_tile: t.name,
    ticks_per_frame: t.frametime,
  }));
  if (flip.length) tex.file("flipbook_textures.json", JSON.stringify(flip, null, 2));

  return zip.generateAsync({ type: "blob" });
}

export function skinDataUrl(skin: { data: number[]; width: number; height: number }): string {
  const c = document.createElement("canvas");
  c.width = skin.width; c.height = skin.height;
  const ctx = c.getContext("2d")!;
  ctx.putImageData(new ImageData(new Uint8ClampedArray(skin.data), skin.width, skin.height), 0, 0);
  return c.toDataURL("image/png");
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
