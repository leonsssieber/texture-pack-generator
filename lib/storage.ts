import { get, set } from "idb-keyval";
import { Project } from "./types";

const KEY = "tpg.project.v1";

export async function saveProject(p: Project) {
  try { await set(KEY, p); } catch (e) { console.warn("save failed", e); }
}

export async function loadProject(): Promise<Project | null> {
  try { return (await get(KEY)) ?? null; } catch { return null; }
}
