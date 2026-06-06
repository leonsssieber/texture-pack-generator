"use client";
import { useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { uid } from "@/lib/image";
import { Volume2, Upload, Trash2, Play } from "lucide-react";

const COMMON_EVENTS = [
  "block.stone.break", "block.grass.break", "block.wood.break",
  "entity.player.levelup", "entity.experience_orb.pickup",
  "music.game", "music.menu", "ambient.cave",
  "block.note_block.harp", "ui.button.click", "entity.generic.explode",
];

export default function SoundsPanel() {
  const s = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [event, setEvent] = useState(COMMON_EVENTS[0]);
  const audioRef = useRef<HTMLAudioElement>(null);

  const onFiles = async (files: FileList | null) => {
    if (!files) return;
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("audio/")) continue;
      const dataUrl = await new Promise<string>((res) => {
        const r = new FileReader(); r.onload = () => res(r.result as string); r.readAsDataURL(file);
      });
      s.addSound({ id: uid(), event, name: file.name, dataUrl, mime: file.type });
    }
  };

  const play = (dataUrl: string) => { if (audioRef.current) { audioRef.current.src = dataUrl; audioRef.current.play(); } };

  return (
    <div className="mx-auto flex h-full max-w-3xl flex-col p-6">
      <div className="mb-4 flex items-center gap-2">
        <Volume2 size={18} className="text-accent" />
        <h2 className="text-lg font-semibold">Sound Replacements</h2>
        <span className="rounded bg-ink-700 px-1.5 py-0.5 text-[10px] text-accent">200 sounds · 20 MB each (premium unlocked)</span>
      </div>

      <div className="card mb-4 p-4">
        <div className="mb-3 flex flex-wrap items-end gap-3">
          <label className="text-xs">
            <div className="mb-1 text-neutral-400">Sound event</div>
            <input list="events" value={event} onChange={(e) => setEvent(e.target.value)}
              className="w-72 rounded-md border border-line bg-ink-850 px-2.5 py-1.5 font-mono text-sm outline-none focus:border-accent-dim" />
            <datalist id="events">{COMMON_EVENTS.map((e) => <option key={e} value={e} />)}</datalist>
          </label>
          <button onClick={() => fileRef.current?.click()} className="btn btn-accent text-sm"><Upload size={14} /> Add audio (.ogg/.mp3/.wav)</button>
          <input ref={fileRef} type="file" accept="audio/*" multiple hidden onChange={(e) => onFiles(e.target.files)} />
        </div>
        <p className="text-xs text-neutral-500">Pick the vanilla event to replace, then upload your file. Exports to assets/minecraft/sounds + a sounds.json with replace:true. (Convert to .ogg for best in-game compatibility.)</p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {!s.project.sounds.length ? (
          <div className="grid h-40 place-items-center rounded-lg border border-dashed border-line text-sm text-neutral-600">No sounds added yet.</div>
        ) : (
          <div className="space-y-2">
            {s.project.sounds.map((snd) => (
              <div key={snd.id} className="card flex items-center gap-3 p-3">
                <button onClick={() => play(snd.dataUrl)} className="grid h-9 w-9 place-items-center rounded-md bg-ink-700 hover:bg-ink-600"><Play size={14} /></button>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{snd.name}</div>
                  <div className="truncate font-mono text-xs text-accent">{snd.event}</div>
                </div>
                <span className="text-xs text-neutral-500">{(snd.dataUrl.length * 0.75 / 1024).toFixed(0)} KB</span>
                <button onClick={() => s.removeSound(snd.id)} className="text-neutral-500 hover:text-red-400"><Trash2 size={15} /></button>
              </div>
            ))}
          </div>
        )}
      </div>
      <audio ref={audioRef} hidden />
    </div>
  );
}
