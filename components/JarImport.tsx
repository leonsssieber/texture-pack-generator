"use client";
import { useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { openJar, importGroups, JarHandle } from "@/lib/jar";
import { Package, X, Loader2 } from "lucide-react";

export default function JarImport({ onClose }: { onClose: () => void }) {
  const s = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [handle, setHandle] = useState<JarHandle | null>(null);
  const [chosen, setChosen] = useState<string[]>([]);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  const onFile = async (f: File | undefined) => {
    if (!f) return;
    setBusy(true); setStatus("Reading .jar…");
    try {
      const h = await openJar(f);
      setHandle(h);
      const def = ["block", "item"].filter((g) => h.groups[g]);
      setChosen(def.length ? def : Object.keys(h.groups));
      setStatus("");
    } catch (e: any) { setStatus(e.message); }
    finally { setBusy(false); }
  };

  const toggle = (g: string) => setChosen((c) => c.includes(g) ? c.filter((x) => x !== g) : [...c, g]);

  const doImport = async () => {
    if (!handle || !chosen.length) return;
    setBusy(true);
    const total = handle.entries.filter((e) => chosen.includes(e.group)).length;
    setStatus(`Decoding 0 / ${total}…`);
    const texs = await importGroups(handle, chosen, (d, t) => setStatus(`Decoding ${d} / ${t}…`));
    s.addTextures(texs);
    setBusy(false);
    setStatus(`Imported ${texs.length} textures.`);
    setTimeout(onClose, 700);
  };

  const groupKeys = handle ? Object.keys(handle.groups).sort() : [];

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={onClose}>
      <div className="card w-full max-w-lg p-5" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center gap-2">
          <Package size={18} className="text-accent" />
          <h3 className="font-semibold">Import vanilla textures from .jar</h3>
          <button onClick={onClose} className="ml-auto text-neutral-400 hover:text-white"><X size={18} /></button>
        </div>

        {!handle ? (
          <div className="space-y-3">
            <button onClick={() => fileRef.current?.click()} disabled={busy}
              className="grid h-32 w-full place-items-center rounded-lg border-2 border-dashed border-line text-sm text-neutral-400 hover:border-accent-dim hover:text-neutral-200">
              {busy ? <Loader2 className="animate-spin" /> : "Click to choose your Minecraft client .jar"}
            </button>
            <input ref={fileRef} type="file" accept=".jar,.zip,application/java-archive" hidden onChange={(e) => onFile(e.target.files?.[0])} />
            <p className="text-xs leading-relaxed text-neutral-500">
              Find it in <span className="font-mono">.minecraft/versions/&lt;version&gt;/&lt;version&gt;.jar</span>
              (Windows: <span className="font-mono">%appdata%\.minecraft\versions</span>). Nothing is uploaded — it's read locally in your browser.
            </p>
            {status && <div className="text-xs text-red-400">{status}</div>}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-xs text-neutral-400">Choose which texture categories to import:</div>
            <div className="grid max-h-64 grid-cols-2 gap-1.5 overflow-y-auto">
              {groupKeys.map((g) => (
                <label key={g} className={`flex cursor-pointer items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm ${chosen.includes(g) ? "border-accent bg-ink-800" : "border-line hover:bg-ink-850"}`}>
                  <input type="checkbox" checked={chosen.includes(g)} onChange={() => toggle(g)} className="h-3.5 w-3.5 accent-emerald-400" />
                  <span className="capitalize">{g}</span>
                  <span className="ml-auto text-xs text-neutral-500">{handle.groups[g]}</span>
                </label>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <button onClick={doImport} disabled={busy || !chosen.length} className="btn btn-accent text-sm disabled:opacity-50">
                {busy ? <Loader2 size={14} className="animate-spin" /> : null}
                Import {handle.entries.filter((e) => chosen.includes(e.group)).length} textures
              </button>
              {status && <span className="text-xs text-accent">{status}</span>}
            </div>
            <p className="text-xs text-neutral-500">Large categories (block/item) can take a few seconds to decode. Animated textures keep their frames.</p>
          </div>
        )}
      </div>
    </div>
  );
}
