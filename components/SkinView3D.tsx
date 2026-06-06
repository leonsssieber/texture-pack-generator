"use client";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { SkinData } from "@/lib/types";
import { buildSkinGroup } from "@/lib/skin";
import { createOrbit, makeShadow } from "@/lib/orbit";
import { RotateCcw, RefreshCw } from "lucide-react";

export default function SkinView3D({ skin, rev }: { skin: SkinData; rev: number }) {
  const mount = useRef<HTMLDivElement>(null);
  const orbitRef = useRef<ReturnType<typeof createOrbit> | null>(null);
  const [spin, setSpin] = useState(false);

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
    const shadow = makeShadow(2.2); shadow.position.y = -1.45; scene.add(shadow);

    const orbit = createOrbit(camera, renderer.domElement, { radius: 4.4, minRadius: 2.5, maxRadius: 8, target: new THREE.Vector3(0, -0.2, 0) });
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
  }, [skin, rev]);

  return (
    <div className="relative h-full w-full">
      <div ref={mount} className="h-full w-full" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-end gap-1.5 p-2">
        <button onClick={() => setSpin((v) => !v)} title="Auto-rotate"
          className={`pointer-events-auto btn text-xs backdrop-blur ${spin ? "btn-accent" : "bg-black/40 text-neutral-200 hover:bg-black/60"}`}>
          <RefreshCw size={12} className={spin ? "animate-spin" : ""} />
        </button>
        <button onClick={() => orbitRef.current?.reset()} title="Reset view"
          className="pointer-events-auto btn bg-black/40 text-xs text-neutral-200 backdrop-blur hover:bg-black/60">
          <RotateCcw size={12} />
        </button>
      </div>
    </div>
  );
}
