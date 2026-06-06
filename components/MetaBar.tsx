"use client";
import { useStore } from "@/lib/store";

export default function MetaBar() {
  const s = useStore();
  const t = s.current();
  if (!t) return null;
  return (
    <div className="flex items-center gap-2 border-b border-line bg-ink-850 px-3 py-1.5 text-xs">
      <span className="text-neutral-500">Name</span>
      <input value={t.name} onChange={(e) => s.renameTexture(t.id, e.target.value, t.mcPath)}
        className="w-32 rounded border border-line bg-ink-900 px-2 py-0.5 outline-none focus:border-accent-dim" />
      <span className="text-neutral-500">Path</span>
      <input value={t.mcPath} onChange={(e) => s.renameTexture(t.id, t.name, e.target.value)}
        className="w-56 rounded border border-line bg-ink-900 px-2 py-0.5 font-mono outline-none focus:border-accent-dim" />
      <span className="ml-auto text-neutral-500">textures/{t.mcPath}.png</span>
    </div>
  );
}
