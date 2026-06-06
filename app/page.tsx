"use client";
import { useEffect } from "react";
import { useStore } from "@/lib/store";
import TopBar from "@/components/TopBar";
import SideNav from "@/components/SideNav";
import EditorPanel from "@/components/EditorPanel";
import VanillaPanel from "@/components/VanillaPanel";
import BatchPanel from "@/components/BatchPanel";
import AnimatePanel from "@/components/AnimatePanel";
import SkinPanel from "@/components/SkinPanel";
import SoundsPanel from "@/components/SoundsPanel";
import PreviewPanel from "@/components/PreviewPanel";
import ExportPanel from "@/components/ExportPanel";

export default function Page() {
  const { hydrate, loaded, activePanel } = useStore();
  useEffect(() => { hydrate(); }, [hydrate]);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-ink-950">
      <TopBar />
      <div className="flex min-h-0 flex-1">
        <SideNav />
        <main className="min-w-0 flex-1 overflow-hidden">
          {!loaded ? (
            <div className="flex h-full items-center justify-center text-neutral-500">Loading workspace…</div>
          ) : (
            <div className="h-full fade-in" key={activePanel}>
              {activePanel === "editor" && <EditorPanel />}
              {activePanel === "vanilla" && <VanillaPanel />}
              {activePanel === "batch" && <BatchPanel />}
              {activePanel === "animate" && <AnimatePanel />}
              {activePanel === "skin" && <SkinPanel />}
              {activePanel === "sounds" && <SoundsPanel />}
              {activePanel === "preview" && <PreviewPanel />}
              {activePanel === "export" && <ExportPanel />}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
