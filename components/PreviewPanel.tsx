"use client";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { useStore } from "@/lib/store";
import { frameToDataURL } from "@/lib/image";
import { createOrbit, makeShadow } from "@/lib/orbit";
import TextureList from "./TextureList";
import { Box, User, RotateCcw, RefreshCw } from "lucide-react";
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

/** Shared overlay: reset view + auto-rotate toggle. */
function ViewControls({ onReset, spin, setSpin }: { onReset: () => void; spin: boolean; setSpin: (v: boolean) => void }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 p-3">
      <span className="pointer-events-none rounded-md bg-black/40 px-2 py-1 text-[11px] text-neutral-300 backdrop-blur">
        Drag to rotate · scroll to zoom
      </span>
      <div className="pointer-events-auto flex gap-1.5">
        <button onClick={() => setSpin(!spin)} title="Auto-rotate"
          className={`btn text-xs backdrop-blur ${spin ? "btn-accent" : "bg-black/40 text-neutral-200 hover:bg-black/60"}`}>
          <RefreshCw size={13} className={spin ? "animate-spin" : ""} /> Spin
        </button>
        <button onClick={onReset} title="Reset view" className="btn bg-black/40 text-xs text-neutral-200 backdrop-blur hover:bg-black/60">
          <RotateCcw size={13} /> Reset
        </button>
      </div>
    </div>
  );
}

function BlockView() {
  const s = useStore();
  const mount = useRef<HTMLDivElement>(null);
  const orbitRef = useRef<ReturnType<typeof createOrbit> | null>(null);
  const [spin, setSpin] = useState(false);
  const t = s.current()!;

  useEffect(() => { if (orbitRef.current) orbitRef.current.autoRotate = spin; }, [spin]);

  useEffect(() => {
    const el = mount.current; if (!el) return;
    const w = el.clientWidth, h = el.clientHeight;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 100);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h); renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
    el.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xffffff, 0x404050, 1.0));
    const dir = new THREE.DirectionalLight(0xffffff, 1.1); dir.position.set(4, 8, 5); scene.add(dir);

    // animated texture support: cycle frames on a canvas
    const tcanvas = document.createElement("canvas");
    tcanvas.width = t.width; tcanvas.height = t.height;
    const tctx = tcanvas.getContext("2d")!;
    const texture = new THREE.CanvasTexture(tcanvas);
    texture.magFilter = THREE.NearestFilter; texture.minFilter = THREE.NearestFilter;
    texture.colorSpace = THREE.SRGBColorSpace;
    const drawFrame = (i: number) => {
      tctx.putImageData(new ImageData(new Uint8ClampedArray(t.frames[i % t.frames.length].data), t.width, t.height), 0, 0);
      texture.needsUpdate = true;
    };
    drawFrame(0);
    const mat = new THREE.MeshStandardMaterial({ map: texture, transparent: true, alphaTest: 0.5, roughness: 1, metalness: 0 });
    const cube = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.6, 1.6), mat);
    cube.rotation.x = 0; scene.add(cube);

    const shadow = makeShadow(3.2); shadow.position.y = -0.95; scene.add(shadow);

    const orbit = createOrbit(camera, renderer.domElement, { radius: 5, minRadius: 2.6, maxRadius: 11, phi: Math.PI * 0.4 });
    orbit.autoRotate = spin; orbitRef.current = orbit;

    let raf = 0, frameI = 0, acc = 0, last = performance.now();
    const loop = () => {
      const now = performance.now(); const dt = now - last; last = now;
      let render = orbit.update();
      if (t.frames.length > 1) {
        acc += dt;
        if (acc > t.frametime * 50) { acc = 0; frameI = (frameI + 1) % t.frames.length; drawFrame(frameI); render = true; }
      }
      if (render) renderer.render(scene, camera);
      raf = requestAnimationFrame(loop);
    };
    loop();

    const onResize = () => {
      const nw = el.clientWidth, nh = el.clientHeight;
      renderer.setSize(nw, nh); camera.aspect = nw / nh; camera.updateProjectionMatrix();
      renderer.render(scene, camera);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      orbit.dispose(); orbitRef.current = null;
      renderer.dispose(); el.removeChild(renderer.domElement);
    };
  }, [t.id, t.frames, t.width, t.height, t.frametime, s.rev]);

  return (
    <div className="flex h-full">
      <div className="relative min-h-0 flex-1">
        <div ref={mount} className="h-full w-full" />
        <ViewControls onReset={() => orbitRef.current?.reset()} spin={spin} setSpin={setSpin} />
      </div>
      <div className="w-48 shrink-0 border-l border-line bg-ink-900 p-3 text-center">
        <img src={frameToDataURL(t.frames[0], t.width, t.height)} width={96} height={96} style={{ imageRendering: "pixelated" }} className="checker mx-auto rounded ring-1 ring-line" alt={t.name} />
        <div className="mt-2 text-sm font-medium">{t.name}</div>
        <div className="text-xs text-neutral-500">{t.frames.length > 1 ? `animated · ${t.frames.length} frames` : "static"}</div>
        <div className="mt-1 text-[11px] text-neutral-600">{t.width}×{t.height}</div>
      </div>
    </div>
  );
}

function CharacterView() {
  const s = useStore();
  const mount = useRef<HTMLDivElement>(null);
  const orbitRef = useRef<ReturnType<typeof createOrbit> | null>(null);
  const [spin, setSpin] = useState(false);
  const skin = s.project.skin ?? defaultSkin();

  useEffect(() => { if (orbitRef.current) orbitRef.current.autoRotate = spin; }, [spin]);

  useEffect(() => {
    const el = mount.current; if (!el) return;
    const w = el.clientWidth, h = el.clientHeight;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h); renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
    el.appendChild(renderer.domElement);

    const group = buildSkinGroup(skin); scene.add(group);
    const shadow = makeShadow(2.4); shadow.position.y = -1.45; scene.add(shadow);

    const orbit = createOrbit(camera, renderer.domElement, { radius: 4.5, minRadius: 2.5, maxRadius: 9, target: new THREE.Vector3(0, -0.2, 0) });
    orbit.autoRotate = spin; orbitRef.current = orbit;

    let raf = 0;
    const loop = () => { if (orbit.update()) renderer.render(scene, camera); raf = requestAnimationFrame(loop); };
    loop();

    const onResize = () => {
      const nw = el.clientWidth, nh = el.clientHeight;
      renderer.setSize(nw, nh); camera.aspect = nw / nh; camera.updateProjectionMatrix();
      renderer.render(scene, camera);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      orbit.dispose(); orbitRef.current = null;
      renderer.dispose(); el.removeChild(renderer.domElement);
    };
  }, [skin, s.rev]);

  return (
    <div className="relative h-full w-full">
      <div ref={mount} className="h-full w-full" />
      <ViewControls onReset={() => orbitRef.current?.reset()} spin={spin} setSpin={setSpin} />
    </div>
  );
}
