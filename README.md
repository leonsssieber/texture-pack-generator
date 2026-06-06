# Texture Pack Generator

A free, browser-based Minecraft **resource pack / texture pack maker** — built with Next.js and deployable to Vercel. Everything runs locally in your browser (projects are saved to IndexedDB); there's no backend, no login, and **all the "premium" features are unlocked**.

> Not affiliated with Mojang or Microsoft. This tool does **not** ship Minecraft's textures or sounds. Instead, the **Vanilla Assets** browser pulls the real block/item/entity textures and the full sound catalogue straight from **Mojang's official servers** at runtime (the same endpoints the launcher uses — they allow cross-origin requests, so everything stays client-side). Nothing is uploaded and nothing copyrighted is committed to this repo. The default sample tiles are original, procedurally generated graphics.

## Features

- **Vanilla asset browser (live)** — pick any Minecraft version and browse **every real texture and sound**, loaded on demand from Mojang. Textures (with animation `.mcmeta` frames preserved) come from the official client `.jar`; the ~4,500-entry sound catalogue comes from the asset index and plays in-browser. Drop any texture into your pack with one click, or send any sound's event to the Sounds tab to replace it. A manual **.jar import** is still available as an offline fallback.
- **Pixel texture editor** — brush, eraser, fill (flood), eyedropper, and a shade tool (lighten / darken / tint). Adjustable brush size, zoom, grid, undo/redo, color palette with saveable swatches. Canvas sizes from 8² to 128².
- **Batch / bulk editor** (the paid feature, free here) — multi-select any number of textures and apply **tint, brightness, contrast, hue shift, invert, grayscale, and upscaling up to 32×** across all of them at once. Operations skip transparent pixels and apply across every animation frame.
- **Animation + GIF import** — turn any static texture into a per-frame animation, set frametime + interpolation, and **drop a GIF to auto-split it into frames** (no size cap). Live playback preview.
- **Skin editor** — paint a 64×64 player skin on a flat layout with UV-region guides, choose wide/slim model, import an existing 64×64 PNG, and see a **3D character** you can drag to rotate.
- **3D preview** — view any texture mapped onto a block, or preview the player model. **Drag to orbit, scroll to zoom**, reset the view, and toggle auto-spin on/off (off by default). Animated textures play in 3D, with proper lighting and a contact shadow.
- **Sound replacement** — browse and preview the full vanilla sound catalogue, then map your own audio to any sound event; packaged into the export.
- **Export** to both **Java** (`.zip` with `pack.mcmeta`, correct asset paths, animation `.mcmeta`, `sounds.json`) and **Bedrock** (`.mcpack` with `manifest.json` + `flipbook_textures.json`). Pack-format selector for Java 1.6 → 1.21+.

## Tech

Next.js 14 (App Router) · React 18 · TypeScript · Tailwind CSS · Zustand · three.js · JSZip · gifuct-js · idb-keyval.

## Run locally

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
```

## Deploy to Vercel

This repo is already Vercel-ready. Either:

1. Push to GitHub (already wired to `origin`) and **import the repo at vercel.com** — Vercel auto-detects Next.js, no config needed. Or
2. `npm i -g vercel && vercel` from this folder.

No environment variables required.

### Note on build-blocking checks

`next.config.mjs` sets `eslint.ignoreDuringBuilds` and `typescript.ignoreBuildErrors` to `true` so deploys don't fail on lint/type nits. Once you've run `next build` locally and are happy, flip them back to `false` for stricter CI.

## How storage works

Your project (textures, sounds, skin, settings) is saved automatically to your browser's IndexedDB. Clearing site data wipes it — use **Export** to keep a copy. "New" in the top bar starts a fresh project.
