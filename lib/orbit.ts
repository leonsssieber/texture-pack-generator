import * as THREE from "three";

export interface Orbit {
  /** advance one frame; returns true if the camera moved and a render is needed */
  update(): boolean;
  reset(): void;
  dispose(): void;
  autoRotate: boolean;
}

interface OrbitOpts {
  radius?: number;
  minRadius?: number;
  maxRadius?: number;
  target?: THREE.Vector3;
  /** initial azimuth / polar angles (radians) */
  theta?: number;
  phi?: number;
}

/**
 * Lightweight orbit controller: drag to rotate (both axes), wheel to zoom.
 * No auto-spin unless `autoRotate` is set. Drives the camera around `target`
 * using spherical coordinates and reports when a redraw is required.
 */
export function createOrbit(camera: THREE.PerspectiveCamera, dom: HTMLElement, opts: OrbitOpts = {}): Orbit {
  const target = opts.target ?? new THREE.Vector3(0, 0, 0);
  const init = {
    radius: opts.radius ?? 4,
    theta: opts.theta ?? Math.PI * 0.25,
    phi: opts.phi ?? Math.PI * 0.46,
  };
  const minR = opts.minRadius ?? init.radius * 0.5;
  const maxR = opts.maxRadius ?? init.radius * 2.2;

  let radius = init.radius;
  let theta = init.theta; // azimuth around Y
  let phi = init.phi;     // polar from +Y, clamped away from the poles
  let autoRotate = false;
  let dragging = false;
  let lastX = 0, lastY = 0;
  let dirty = true;

  const apply = () => {
    const sinPhi = Math.sin(phi);
    camera.position.set(
      target.x + radius * sinPhi * Math.sin(theta),
      target.y + radius * Math.cos(phi),
      target.z + radius * sinPhi * Math.cos(theta)
    );
    camera.lookAt(target);
  };

  const onDown = (e: PointerEvent) => {
    dragging = true; lastX = e.clientX; lastY = e.clientY;
    try { dom.setPointerCapture(e.pointerId); } catch { /* noop */ }
  };
  const onMove = (e: PointerEvent) => {
    if (!dragging) return;
    theta -= (e.clientX - lastX) * 0.01;
    phi = Math.min(Math.PI - 0.12, Math.max(0.12, phi - (e.clientY - lastY) * 0.01));
    lastX = e.clientX; lastY = e.clientY;
    dirty = true;
  };
  const onUp = () => { dragging = false; };
  const onWheel = (e: WheelEvent) => {
    e.preventDefault();
    radius = Math.min(maxR, Math.max(minR, radius + e.deltaY * 0.0015 * radius));
    dirty = true;
  };

  dom.style.touchAction = "none";
  dom.style.cursor = "grab";
  dom.addEventListener("pointerdown", onDown);
  dom.addEventListener("pointermove", onMove);
  window.addEventListener("pointerup", onUp);
  dom.addEventListener("wheel", onWheel, { passive: false });

  apply();

  return {
    get autoRotate() { return autoRotate; },
    set autoRotate(v: boolean) { autoRotate = v; },
    update() {
      if (autoRotate && !dragging) { theta -= 0.005; dirty = true; }
      dom.style.cursor = dragging ? "grabbing" : "grab";
      if (dirty) { apply(); dirty = false; return true; }
      return false;
    },
    reset() { radius = init.radius; theta = init.theta; phi = init.phi; dirty = true; },
    dispose() {
      dom.removeEventListener("pointerdown", onDown);
      dom.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      dom.removeEventListener("wheel", onWheel as EventListener);
    },
  };
}

/** A soft round contact-shadow plane to sit a model on (purely cosmetic). */
export function makeShadow(size = 3): THREE.Mesh {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(64, 64, 4, 64, 64, 60);
  g.addColorStop(0, "rgba(0,0,0,0.45)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size, size), mat);
  mesh.rotation.x = -Math.PI / 2;
  return mesh;
}
