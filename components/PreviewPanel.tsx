"use client";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { useStore } from "@/lib/store";
import { frameToDataURL } from "@/lib/image";
import TextureList from "./TextureList";
import { Box, User } from "lucide-react";
import { buildSkinGroup, defaultSkin } from "@/lib/skin";

export default function PreviewPanel() {
  const s = useStore();
  const [mode, setMode] = useState<"block" | "character">("block");
  const t = s.current();

  return (
    <div className="flex h-full">
      <TextureList />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2 border-b border-line bg-ink-900 px-4 py-2.5">
          <Box size={18} className="text-accent" /><h2 className="font-semibold">3D Preview</h2>
          <div className="ml-auto flex gap-1">
            <button onClick={() => setMode("block")} className={`btn text-xs ${mode === "block" ? "btn-accent" : "btn-soft"}`}><Box size={13} /> Block</button>
            <button onClick={() => setMode("character")} className={`btn text-xs ${mode === "character" ? "btn-accent" : "btn-soft"}`}><User size={13} /> Character</button>
          </div>
        </div>
        <div className="min-h-0 flex-1 bg-gradient-to-b from-ink-950 to-ink-900">
          {mode === "block" ? (
            t ? <BlockView /> : <div className="grid h-full place-items-center text-neutral-500">Select a texture.</div>
          ) : <CharacterView />}
        </div>
      </div>
    </div>
  );
}

function BlockView() {
  const s = useStore();
  const mount = useRef<HTMLDivElement>(null);
  const t = s.current()!;

  useEffect(() => {
    const el = mount.current; if (!el) return;
    const w = el.clientWidth, h = el.clientHeight;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 100);
    camera.position.set(2.6, 2.1, 2.6);
    camera.lookAt(0, 0, 0);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h); renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
    el.appendChild(renderer.domElement);
    scene.add(new THREE.AmbientLight(0xffffff, 0.85));
    const dir = new THREE.DirectionalLight(0xffffff, 0.6); dir.position.set(5, 8, 3); scene.add(dir);

    // animated texture support: cycle frames on a canvas
    const tcanvas = document.createElement("canvas");
    tcanvas.width = t.width; tcanvas.height = t.height;
    const tctx = tcanvas.getContext("2d")!;
    const drawFrame = (i: number) => {
      tctx.putImageData(new ImageData(new Uint8ClampedArray(t.frames[i % t.frames.length].data), t.width, t.height), 0, 0);
      texture.needsUpdate = true;
    };
    const texture = new THREE.CanvasTexture(tcanvas);
    texture.magFilter = THREE.NearestFilter; texture.minFilter = THREE.NearestFilter;
    texture.colorSpace = THREE.SRGBColorSpace;
    drawFrame(0);
    const mat = new THREE.MeshStandardMaterial({ map: texture, transparent: true, alphaTest: 0.5, roughness: 1 });
    const cube = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.6, 1.6), mat);
    scene.add(cube);

    let dragging = false, px = 0, ry = 0.6;
    const down = (e: MouseEvent) => { dragging = true; px = e.clientX; };
    const move = (e: MouseEvent) => { if (dragging) { ry += (e.clientX - px) * 0.01; px = e.clientX; } };
    const up = () => (dragging = false);
    renderer.domElement.addEventListener("mousedown", down);
    window.addEventListener("mousemove", move); window.addEventListener("mouseup", up);

    let raf = 0, frameI = 0, acc = 0, last = performance.now();
    const loop = () => {
      const now = performance.now(); const dt = now - last; last = now;
      if (!dragging) ry += 0.005;
      cube.rotation.y = ry; cube.rotation.x = 0.25;
      if (t.frames.length > 1) {
        acc += dt;
        if (acc > t.frametime * 50) { acc = 0; frameI = (frameI + 1) % t.frames.length; drawFrame(frameI); }
      }
      renderer.render(scene, camera);
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => {
      cancelAnimationFrame(raf);
      renderer.domElement.removeEventListener("mousedown", down);
      window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up);
      renderer.dispose(); el.removeChild(renderer.domElement);
    };
  }, [t.id, t.frames, t.width, t.height, t.frametime, s.rev]);

  return (
    <div className="flex h-full">
      <div ref={mount} className="min-h-0 flex-1" />
      <div className="w-48 shrink-0 border-l border-line bg-ink-900 p-3 text-center">
        <img src={frameToDataURL(t.frames[0], t.width, t.height)} width={96} height={96} style={{ imageRendering: "pixelated" }} className="checker mx-auto rounded ring-1 ring-line" alt={t.name} />
        <div className="mt-2 text-sm font-medium">{t.name}</div>
        <div className="text-xs text-neutral-500">{t.frames.length > 1 ? "animated" : "static"}</div>
      </div>
    </div>
  );
}

function CharacterView() {
  const s = useStore();
  const mount = useRef<HTMLDivElement>(null);
  const skin = s.project.skin ?? defaultSkin();
  useEffect(() => {
    const el = mount.current; if (!el) return;
    const w = el.clientWidth, h = el.clientHeight;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
    camera.position.set(0, 0, 4.5);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h); renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
    el.appendChild(renderer.domElement);
    const group = buildSkinGroup(skin); scene.add(group);
    let dragging = false, px = 0, ry = 0.5;
    const down = (e: MouseEvent) => { dragging = true; px = e.clientX; };
    const move = (e: MouseEvent) => { if (dragging) { ry += (e.clientX - px) * 0.01; px = e.clientX; } };
    const up = () => (dragging = false);
    renderer.domElement.addEventListener("mousedown", down);
    window.addEventListener("mousemove", move); window.addEventListener("mouseup", up);
    let raf = 0;
    const loop = () => { if (!dragging) ry += 0.006; group.rotation.y = ry; renderer.render(scene, camera); raf = requestAnimationFrame(loop); };
    loop();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); renderer.dispose(); el.removeChild(renderer.domElement); };
  }, [skin, s.rev]);
  return <div ref={mount} className="h-full w-full" />;
}
