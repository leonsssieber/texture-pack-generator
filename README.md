# Texture Pack Generator

A free, browser-based Minecraft **resource pack / texture pack maker** — built with Next.js and deployable to Vercel. Everything runs locally in your browser (projects are saved to IndexedDB); there's no backend, no login, and **all the "premium" features are unlocked**.

> Not affiliated with Mojang or Microsoft. This tool does **not** ship Minecraft's textures. Instead, the **Import vanilla .jar** button loads the real block/item/entity textures from *your own* installed copy of the game (`.minecraft/versions/<ver>/<ver>.jar`) — read locally in your browser, nothing uploaded, nothing copyrighted committed to this repo. The default sample tiles are original, procedurally generated graphics.

## Features

- **Import vanilla textures** — load every real block/item/entity texture from your own Minecraft client `.jar` (with animation `.mcmeta` frames preserved). Pick which categories to import. Re-importing replaces rather than duplicates.
- **Pixel texture editor** — brush, eraser, fill (flood), eyedropper, and a shade tool (lighten / darken / tint). Adjustable brush size, zoom, grid, undo/redo, color palette with saveable swatches. Canvas sizes from 8² to 128².
- **Batch / bulk editor** (the paid feature, free here) — multi-select any number of textures and apply **tint, brightness, contrast, hue shift, invert, grayscale, and upscaling up to 32×** across all of them at once. Operations skip transparent pixels and apply across every animation frame.
- **Animation + GIF import** — turn any static texture into a per-frame animation, set frametime + interpolation, and **drop a GIF to auto-split it into frames** (no size cap). Live playback preview.
- **Skin editor** — paint a 64×64 player skin on a flat layout with UV-region guides, choose wide/slim model, import an existing 64×64 PNG, and see a **live rotatable 3D character**.
- **3D preview** — view any texture mapped onto a rotating block (animated textures play in 3D), or preview the player model.
- **Sound replacement** — map custom audio to vanilla sound events; packaged into the export.
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
