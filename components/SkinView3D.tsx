"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { SkinData } from "@/lib/types";
import { buildSkinGroup } from "@/lib/skin";

export default function SkinView3D({ skin, rev }: { skin: SkinData; rev: number }) {
  const mount = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = mount.current; if (!el) return;
    const w = el.clientWidth, h = el.clientHeight;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
    camera.position.set(0, 0, 4.2);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h); renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
    el.appendChild(renderer.domElement);

    const group = buildSkinGroup(skin);
    scene.add(group);

    let dragging = false, px = 0, ry = 0.5, rx = 0;
    const down = (e: MouseEvent) => { dragging = true; px = e.clientX; };
    const move = (e: MouseEvent) => { if (dragging) { ry += (e.clientX - px) * 0.01; px = e.clientX; } };
    const up = () => { dragging = false; };
    renderer.domElement.addEventListener("mousedown", down);
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);

    let raf = 0;
    const loop = () => {
      if (!dragging) ry += 0.006;
      group.rotation.y = ry; group.rotation.x = rx;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      cancelAnimationFrame(raf);
      renderer.domElement.removeEventListener("mousedown", down);
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
      renderer.dispose();
      el.removeChild(renderer.domElement);
    };
  }, [skin, rev]);

  return <div ref={mount} className="h-full w-full" />;
}
