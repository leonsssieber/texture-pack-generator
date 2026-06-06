"use client";
import { useStore, Panel } from "@/lib/store";
import { Brush, Boxes, Layers, Film, User, Volume2, Box, Download } from "lucide-react";

const items: { id: Panel; label: string; icon: any }[] = [
  { id: "editor", label: "Editor", icon: Brush },
  { id: "vanilla", label: "Vanilla", icon: Boxes },
  { id: "batch", label: "Batch", icon: Layers },
  { id: "animate", label: "Animate", icon: Film },
  { id: "skin", label: "Skin", icon: User },
  { id: "sounds", label: "Sounds", icon: Volume2 },
  { id: "preview", label: "3D", icon: Box },
  { id: "export", label: "Export", icon: Download },
];

export default function SideNav() {
  const { activePanel, setPanel } = useStore();
  return (
    <nav className="flex w-16 shrink-0 flex-col items-center gap-1 border-r border-line bg-ink-900 py-3">
      {items.map(({ id, label, icon: Icon }) => {
        const active = activePanel === id;
        return (
          <button
            key={id}
            onClick={() => setPanel(id)}
            className={`group flex w-14 flex-col items-center gap-1 rounded-lg py-2 text-[10px] font-medium transition-colors ${
              active ? "bg-ink-700 text-accent" : "text-neutral-400 hover:bg-ink-850 hover:text-neutral-100"
            }`}
          >
            <Icon size={18} />
            {label}
          </button>
        );
      })}
    </nav>
  );
}
