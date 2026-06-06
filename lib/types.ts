export type ToolId =
  | "brush" | "eraser" | "fill" | "eyedropper" | "shade" | "line" | "rect";

export type ShadeMode = "lighten" | "darken" | "tint";

export interface Frame {
  // RGBA pixel data, length = w*h*4
  data: number[];
}

export interface Texture {
  id: string;
  name: string;          // file name e.g. "stone"
  category: string;      // block | item | entity | gui | custom
  mcPath: string;        // path under textures/, e.g. "block/stone"
  width: number;
  height: number;
  frames: Frame[];       // 1 = static, >1 = animation
  frametime: number;     // ticks per frame (animation)
  interpolate: boolean;
}

export interface SoundEntry {
  id: string;
  event: string;         // e.g. "block.stone.break" or custom
  name: string;          // file name
  dataUrl: string;       // base64 audio
  mime: string;
}

export interface SkinData {
  id: string;
  name: string;
  model: "wide" | "slim";
  width: number;         // 64
  height: number;        // 64
  data: number[];        // RGBA
}

export interface Project {
  name: string;
  edition: "java" | "bedrock";
  packFormat: number;
  textures: Texture[];
  sounds: SoundEntry[];
  skin: SkinData | null;
}
