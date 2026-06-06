import * as THREE from "three";
import { SkinData } from "./types";
import { uid } from "./image";

// Pixel rects [x,y,w,h] into the 64x64 skin sheet, per body part / face.
// Face order matches THREE.BoxGeometry: [px(right), nx(left), py(top), ny(bottom), pz(front), nz(back)]
type Rects = [number, number, number, number][];

export const REGIONS: Record<string, { size: [number, number, number]; pos: [number, number, number]; uv: Rects }> = {
  head: { size: [8, 8, 8], pos: [0, 26, 0], uv: [[0,8,8,8],[16,8,8,8],[8,0,8,8],[16,0,8,8],[8,8,8,8],[24,8,8,8]] },
  body: { size: [8, 12, 4], pos: [0, 16, 0], uv: [[16,20,4,12],[28,20,4,12],[20,16,8,4],[28,16,8,4],[20,20,8,12],[32,20,8,12]] },
  rightArm: { size: [4, 12, 4], pos: [-6, 16, 0], uv: [[40,20,4,12],[48,20,4,12],[44,16,4,4],[48,16,4,4],[44,20,4,12],[52,20,4,12]] },
  leftArm: { size: [4, 12, 4], pos: [6, 16, 0], uv: [[32,52,4,12],[40,52,4,12],[36,48,4,4],[40,48,4,4],[36,52,4,12],[44,52,4,12]] },
  rightLeg: { size: [4, 12, 4], pos: [-2, 4, 0], uv: [[0,20,4,12],[8,20,4,12],[4,16,4,4],[8,16,4,4],[4,20,4,12],[12,20,4,12]] },
  leftLeg: { size: [4, 12, 4], pos: [2, 4, 0], uv: [[16,52,4,12],[24,52,4,12],[20,48,4,4],[24,48,4,4],[20,52,4,12],[28,52,4,12]] },
};

function setUV(geo: THREE.BoxGeometry, rects: Rects, texW = 64, texH = 64) {
  const uv = geo.attributes.uv as THREE.BufferAttribute;
  rects.forEach((r, faceIdx) => {
    const [px, py, pw, ph] = r;
    const u0 = px / texW, u1 = (px + pw) / texW;
    const v0 = 1 - (py + ph) / texH, v1 = 1 - py / texH;
    const o = faceIdx * 4;
    uv.setXY(o + 0, u0, v1);
    uv.setXY(o + 1, u1, v1);
    uv.setXY(o + 2, u0, v0);
    uv.setXY(o + 3, u1, v0);
  });
  uv.needsUpdate = true;
}

export function skinTexture(skin: SkinData): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = skin.width; c.height = skin.height;
  c.getContext("2d")!.putImageData(new ImageData(new Uint8ClampedArray(skin.data), skin.width, skin.height), 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function buildSkinGroup(skin: SkinData): THREE.Group {
  const tex = skinTexture(skin);
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.5 });
  const g = new THREE.Group();
  for (const key of Object.keys(REGIONS)) {
    const part = REGIONS[key];
    const [w, h, d] = part.size;
    const geo = new THREE.BoxGeometry(w, h, d);
    setUV(geo, part.uv);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(part.pos[0], part.pos[1], part.pos[2]);
    g.add(mesh);
  }
  g.scale.setScalar(0.09);
  g.position.y = -1.4;
  return g;
}

// Generate an original default character (not a Mojang skin).
export function defaultSkin(): SkinData {
  const W = 64, H = 64;
  const data = new Array(W * H * 4).fill(0);
  const put = (x: number, y: number, c: [number, number, number]) => {
    const i = (y * W + x) * 4; data[i] = c[0]; data[i + 1] = c[1]; data[i + 2] = c[2]; data[i + 3] = 255;
  };
  const fill = (rx: number, ry: number, rw: number, rh: number, c: [number, number, number], jitter = 0) => {
    for (let y = ry; y < ry + rh; y++) for (let x = rx; x < rx + rw; x++) {
      const j = jitter ? Math.round((Math.sin(x * 3.1 + y * 1.7) ) * jitter) : 0;
      put(x, y, [Math.max(0, Math.min(255, c[0] + j)), Math.max(0, Math.min(255, c[1] + j)), Math.max(0, Math.min(255, c[2] + j))]);
    }
  };
  const skinTone: [number, number, number] = [214, 175, 140];
  const hair: [number, number, number] = [60, 45, 40];
  const shirt: [number, number, number] = [52, 211, 153];
  const pants: [number, number, number] = [40, 44, 60];
  // Head faces (use simple front/back/sides + top hair)
  fill(8, 8, 24, 8, skinTone, 6);   // sides+front+back band
  fill(8, 0, 16, 8, hair, 8);       // top + bottom of head
  fill(8, 8, 8, 3, hair, 6);        // front hairline (right side region)
  fill(16, 8, 8, 3, hair, 6);       // front hairline
  // eyes on front face (front face is x 8..16, y 8..16)
  put(10, 12, [30, 30, 40]); put(13, 12, [30, 30, 40]);
  // Body
  fill(16, 20, 24, 12, shirt, 8); fill(20, 16, 16, 4, shirt, 6);
  // Arms
  fill(40, 20, 16, 12, shirt, 8); fill(44, 16, 8, 4, skinTone, 4);
  fill(32, 52, 16, 12, shirt, 8); fill(36, 48, 8, 4, skinTone, 4);
  // Legs
  fill(0, 20, 16, 12, pants, 8); fill(4, 16, 8, 4, pants, 4);
  fill(16, 52, 16, 12, pants, 8); fill(20, 48, 8, 4, pants, 4);
  return { id: uid(), name: "character", model: "wide", width: W, height: H, data };
}
