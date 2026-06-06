// Live loader for *vanilla* Minecraft assets, straight from Mojang's official
// servers — all client-side (these endpoints send `Access-Control-Allow-Origin: *`).
// Nothing copyrighted is bundled in this repo: textures come from the client .jar
// you download on demand, and sounds stream directly from Mojang's asset CDN.
import { openJar, JarHandle } from "./jar";

const MANIFEST = "https://piston-meta.mojang.com/mc/game/version_manifest_v2.json";
const RESOURCES = "https://resources.download.minecraft.net";

export interface MCVersion {
  id: string;
  type: "release" | "snapshot" | "old_beta" | "old_alpha";
  url: string;
  releaseTime: string;
}
export interface Manifest {
  latest: { release: string; snapshot: string };
  versions: MCVersion[];
}

export interface VanillaSound {
  /** human path under sounds/, e.g. "block/stone/break1" */
  path: string;
  hash: string;
  size: number;
  /** direct streamable url (cross-origin <audio> playback is allowed) */
  url: string;
}

let manifestCache: Manifest | null = null;

export async function getManifest(): Promise<Manifest> {
  if (manifestCache) return manifestCache;
  const res = await fetch(MANIFEST);
  if (!res.ok) throw new Error(`Couldn't reach Mojang (${res.status}).`);
  manifestCache = (await res.json()) as Manifest;
  return manifestCache;
}

interface VersionDetail {
  assetIndex: { url: string };
  downloads: { client: { url: string; size: number } };
}

async function getVersionDetail(v: MCVersion): Promise<VersionDetail> {
  const res = await fetch(v.url);
  if (!res.ok) throw new Error(`Couldn't load ${v.id} metadata.`);
  return (await res.json()) as VersionDetail;
}

/** Download the client .jar (with progress) and index its texture entries. */
export async function loadVanillaJar(
  v: MCVersion,
  onProgress?: (loaded: number, total: number) => void
): Promise<JarHandle> {
  const detail = await getVersionDetail(v);
  const { url, size } = detail.downloads.client;
  const res = await fetch(url);
  if (!res.ok || !res.body) throw new Error(`Download failed (${res.status}).`);

  const total = size || Number(res.headers.get("content-length")) || 0;
  const reader = res.body.getReader();
  const chunks: BlobPart[] = [];
  let loaded = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    loaded += value.length;
    onProgress?.(loaded, total);
  }
  const blob = new Blob(chunks, { type: "application/java-archive" });
  const file = new File([blob], `${v.id}.jar`, { type: "application/java-archive" });
  return openJar(file);
}

/** List every vanilla sound (.ogg) for a version from its asset index. */
export async function loadVanillaSounds(v: MCVersion): Promise<VanillaSound[]> {
  const detail = await getVersionDetail(v);
  const res = await fetch(detail.assetIndex.url);
  if (!res.ok) throw new Error(`Couldn't load sound index (${res.status}).`);
  const idx = (await res.json()) as { objects: Record<string, { hash: string; size: number }> };
  const out: VanillaSound[] = [];
  for (const [key, obj] of Object.entries(idx.objects)) {
    if (!key.startsWith("minecraft/sounds/") || !key.endsWith(".ogg")) continue;
    const path = key.slice("minecraft/sounds/".length, -".ogg".length);
    out.push({ path, hash: obj.hash, size: obj.size, url: `${RESOURCES}/${obj.hash.slice(0, 2)}/${obj.hash}` });
  }
  out.sort((a, b) => a.path.localeCompare(b.path));
  return out;
}

/** A reasonable sound-event guess from a file path, e.g. block/stone/break1 -> block.stone.break */
export function eventFromPath(path: string): string {
  return path.replace(/\d+$/, "").replace(/\/+$/, "").replace(/\//g, ".");
}
