"use client";
import { create } from "zustand";
import { Project, Texture, ToolId, ShadeMode, SoundEntry, SkinData, Frame } from "./types";
import { emptyFrame, cloneFrame, uid } from "./image";
import { starterTextures } from "./starter";
import { saveProject, loadProject } from "./storage";

export type Panel = "editor" | "batch" | "animate" | "skin" | "sounds" | "preview" | "export";

interface EditorState {
  project: Project;
  loaded: boolean;
  activePanel: Panel;
  selectedId: string | null;     // texture being edited
  selectedFrame: number;
  tool: ToolId;
  color: string;
  secondaryColor: string;
  brushSize: number;
  shadeMode: ShadeMode;
  shadeStrength: number;
  zoom: number;
  showGrid: boolean;
  palette: string[];
  batchSelection: string[];      // texture ids selected for batch ops
  // history per texture id
  undoStack: Record<string, Frame[][]>;
  redoStack: Record<string, Frame[][]>;

  setPanel: (p: Panel) => void;
  select: (id: string) => void;
  setFrame: (i: number) => void;
  setTool: (t: ToolId) => void;
  setColor: (c: string) => void;
  setSecondary: (c: string) => void;
  setBrushSize: (n: number) => void;
  setShadeMode: (m: ShadeMode) => void;
  setShadeStrength: (n: number) => void;
  setZoom: (n: number) => void;
  toggleGrid: () => void;
  addPaletteColor: (c: string) => void;

  current: () => Texture | undefined;
  pushHistory: (id: string) => void;
  commit: () => void;            // persist + notify
  undo: () => void;
  redo: () => void;

  addTexture: (t: Texture) => void;
  addTextures: (ts: Texture[]) => void;
  removeTexture: (id: string) => void;
  renameTexture: (id: string, name: string, mcPath: string) => void;
  replaceFrames: (id: string, frames: Frame[], w?: number, h?: number) => void;
  updateTextureMeta: (id: string, patch: Partial<Texture>) => void;

  addFrame: () => void;
  duplicateFrame: () => void;
  deleteFrame: () => void;

  toggleBatch: (id: string) => void;
  setBatchSelection: (ids: string[]) => void;

  addSound: (s: SoundEntry) => void;
  removeSound: (id: string) => void;
  setSkin: (s: SkinData | null) => void;

  setProjectMeta: (patch: Partial<Project>) => void;
  newProject: () => void;
  hydrate: () => Promise<void>;

  // bump to trigger canvas redraws after in-place edits
  rev: number;
  bump: () => void;
}

function defaultProject(): Project {
  return {
    name: "My Pack",
    edition: "java",
    packFormat: 34,
    textures: starterTextures(),
    sounds: [],
    skin: null,
  };
}

export const useStore = create<EditorState>((setState, getState) => ({
  project: defaultProject(),
  loaded: false,
  activePanel: "editor",
  selectedId: null,
  selectedFrame: 0,
  tool: "brush",
  color: "#6ee7b7",
  secondaryColor: "#101014",
  brushSize: 1,
  shadeMode: "lighten",
  shadeStrength: 25,
  zoom: 24,
  showGrid: true,
  palette: ["#000000", "#ffffff", "#6ee7b7", "#ef4444", "#3b82f6", "#f59e0b", "#a855f7", "#22c55e", "#78716c", "#0ea5e9"],
  batchSelection: [],
  undoStack: {},
  redoStack: {},
  rev: 0,

  setPanel: (p) => setState({ activePanel: p }),
  select: (id) => setState({ selectedId: id, selectedFrame: 0 }),
  setFrame: (i) => setState({ selectedFrame: i }),
  setTool: (t) => setState({ tool: t }),
  setColor: (c) => setState({ color: c }),
  setSecondary: (c) => setState({ secondaryColor: c }),
  setBrushSize: (n) => setState({ brushSize: n }),
  setShadeMode: (m) => setState({ shadeMode: m }),
  setShadeStrength: (n) => setState({ shadeStrength: n }),
  setZoom: (n) => setState({ zoom: Math.max(2, Math.min(64, n)) }),
  toggleGrid: () => setState((s) => ({ showGrid: !s.showGrid })),
  addPaletteColor: (c) => setState((s) => s.palette.includes(c) ? s : ({ palette: [...s.palette, c] })),

  current: () => {
    const s = getState();
    return s.project.textures.find((t) => t.id === s.selectedId);
  },

  pushHistory: (id) => {
    const s = getState();
    const t = s.project.textures.find((x) => x.id === id);
    if (!t) return;
    const snap = t.frames.map(cloneFrame);
    const stack = { ...s.undoStack };
    stack[id] = [...(stack[id] || []), snap].slice(-30);
    setState({ undoStack: stack, redoStack: { ...s.redoStack, [id]: [] } });
  },

  commit: () => {
    const s = getState();
    saveProject(s.project);
    setState({ rev: s.rev + 1 });
  },

  undo: () => {
    const s = getState();
    const id = s.selectedId; if (!id) return;
    const stack = (s.undoStack[id] || []).slice();
    const prev = stack.pop(); if (!prev) return;
    const t = s.project.textures.find((x) => x.id === id); if (!t) return;
    const cur = t.frames.map(cloneFrame);
    const textures = s.project.textures.map((x) => x.id === id ? { ...x, frames: prev.map(cloneFrame) } : x);
    setState({
      project: { ...s.project, textures },
      undoStack: { ...s.undoStack, [id]: stack },
      redoStack: { ...s.redoStack, [id]: [...(s.redoStack[id] || []), cur] },
      rev: s.rev + 1,
    });
    saveProject({ ...s.project, textures });
  },

  redo: () => {
    const s = getState();
    const id = s.selectedId; if (!id) return;
    const stack = (s.redoStack[id] || []).slice();
    const next = stack.pop(); if (!next) return;
    const t = s.project.textures.find((x) => x.id === id); if (!t) return;
    const cur = t.frames.map(cloneFrame);
    const textures = s.project.textures.map((x) => x.id === id ? { ...x, frames: next.map(cloneFrame) } : x);
    setState({
      project: { ...s.project, textures },
      redoStack: { ...s.redoStack, [id]: stack },
      undoStack: { ...s.undoStack, [id]: [...(s.undoStack[id] || []), cur] },
      rev: s.rev + 1,
    });
    saveProject({ ...s.project, textures });
  },

  addTexture: (t) => setState((s) => {
    const project = { ...s.project, textures: [...s.project.textures, t] };
    saveProject(project);
    return { project, selectedId: t.id, selectedFrame: 0, rev: s.rev + 1 };
  }),

  addTextures: (ts) => setState((s) => {
    if (!ts.length) return {};
    // de-dupe against existing mcPaths so re-importing a jar replaces, not doubles
    const byPath = new Map(s.project.textures.map((t) => [t.mcPath, t] as const));
    for (const t of ts) byPath.set(t.mcPath, t);
    const textures = Array.from(byPath.values());
    const project = { ...s.project, textures };
    saveProject(project);
    return { project, selectedId: ts[0].id, rev: s.rev + 1 };
  }),

  removeTexture: (id) => setState((s) => {
    const textures = s.project.textures.filter((t) => t.id !== id);
    const project = { ...s.project, textures };
    saveProject(project);
    return { project, selectedId: s.selectedId === id ? (textures[0]?.id ?? null) : s.selectedId, rev: s.rev + 1 };
  }),

  renameTexture: (id, name, mcPath) => setState((s) => {
    const textures = s.project.textures.map((t) => t.id === id ? { ...t, name, mcPath } : t);
    const project = { ...s.project, textures };
    saveProject(project);
    return { project, rev: s.rev + 1 };
  }),

  replaceFrames: (id, frames, w, h) => setState((s) => {
    const textures = s.project.textures.map((t) => t.id === id ? { ...t, frames, ...(w ? { width: w } : {}), ...(h ? { height: h } : {}) } : t);
    const project = { ...s.project, textures };
    saveProject(project);
    return { project, rev: s.rev + 1 };
  }),

  updateTextureMeta: (id, patch) => setState((s) => {
    const textures = s.project.textures.map((t) => t.id === id ? { ...t, ...patch } : t);
    const project = { ...s.project, textures };
    saveProject(project);
    return { project, rev: s.rev + 1 };
  }),

  addFrame: () => setState((s) => {
    const t = s.project.textures.find((x) => x.id === s.selectedId); if (!t) return {};
    const frames = [...t.frames, emptyFrame(t.width, t.height)];
    const textures = s.project.textures.map((x) => x.id === t.id ? { ...x, frames } : x);
    const project = { ...s.project, textures };
    saveProject(project);
    return { project, selectedFrame: frames.length - 1, rev: s.rev + 1 };
  }),

  duplicateFrame: () => setState((s) => {
    const t = s.project.textures.find((x) => x.id === s.selectedId); if (!t) return {};
    const frames = [...t.frames]; frames.splice(s.selectedFrame + 1, 0, cloneFrame(t.frames[s.selectedFrame]));
    const textures = s.project.textures.map((x) => x.id === t.id ? { ...x, frames } : x);
    const project = { ...s.project, textures };
    saveProject(project);
    return { project, selectedFrame: s.selectedFrame + 1, rev: s.rev + 1 };
  }),

  deleteFrame: () => setState((s) => {
    const t = s.project.textures.find((x) => x.id === s.selectedId); if (!t || t.frames.length <= 1) return {};
    const frames = t.frames.filter((_, i) => i !== s.selectedFrame);
    const textures = s.project.textures.map((x) => x.id === t.id ? { ...x, frames } : x);
    const project = { ...s.project, textures };
    saveProject(project);
    return { project, selectedFrame: Math.max(0, s.selectedFrame - 1), rev: s.rev + 1 };
  }),

  toggleBatch: (id) => setState((s) => ({
    batchSelection: s.batchSelection.includes(id) ? s.batchSelection.filter((x) => x !== id) : [...s.batchSelection, id],
  })),
  setBatchSelection: (ids) => setState({ batchSelection: ids }),

  addSound: (snd) => setState((s) => {
    const project = { ...s.project, sounds: [...s.project.sounds, snd] };
    saveProject(project); return { project };
  }),
  removeSound: (id) => setState((s) => {
    const project = { ...s.project, sounds: s.project.sounds.filter((x) => x.id !== id) };
    saveProject(project); return { project };
  }),
  setSkin: (skin) => setState((s) => {
    const project = { ...s.project, skin };
    saveProject(project); return { project, rev: s.rev + 1 };
  }),

  setProjectMeta: (patch) => setState((s) => {
    const project = { ...s.project, ...patch };
    saveProject(project); return { project };
  }),

  newProject: () => setState((s) => {
    const project = defaultProject();
    saveProject(project);
    return { project, selectedId: project.textures[0]?.id ?? null, batchSelection: [], rev: s.rev + 1 };
  }),

  hydrate: async () => {
    const saved = await loadProject();
    const project = saved ?? defaultProject();
    setState({ project, loaded: true, selectedId: project.textures[0]?.id ?? null });
    if (!saved) saveProject(project);
  },

  bump: () => setState((s) => ({ rev: s.rev + 1 })),
}));
