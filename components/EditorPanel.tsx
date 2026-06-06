"use client";
import { useEffect } from "react";
import { useStore } from "@/lib/store";
import TextureList from "./TextureList";
import Toolbar from "./Toolbar";
import PixelCanvas from "./PixelCanvas";
import Palette from "./Palette";
import MetaBar from "./MetaBar";

export default function EditorPanel() {
  const s = useStore();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT") return;
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "z") { e.preventDefault(); s.undo(); }
        if (e.key === "y") { e.preventDefault(); s.redo(); }
        return;
      }
      const map: Record<string, any> = { b: "brush", e: "eraser", g: "fill", i: "eyedropper", s: "shade" };
      if (map[e.key]) s.setTool(map[e.key]);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [s]);

  return (
    <div className="flex h-full">
      <TextureList />
      <div className="flex min-w-0 flex-1 flex-col">
        <MetaBar />
        <Toolbar />
        <div className="min-h-0 flex-1 bg-ink-950"><PixelCanvas /></div>
        <Palette />
      </div>
    </div>
  );
}
