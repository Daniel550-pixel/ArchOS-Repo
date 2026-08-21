# MOTION / FORM — Gesture-Controlled Transformation Films

> **Architecture Tier:** `JARVIS / AIOS` → `EXPERIENCE ENGINE` → `MOTION / FORM MODULE`

An editorial, gesture-controlled cinematic 3D exploded view transformation module built in React, TypeScript, Vite, and Tailwind CSS. Users swipe through editorial experience cards, hold an open palm to select, and continuously manipulate physical time via optical pinch distance gestures mapped directly to 3D video timelines.

---

## 1. Architectural Integration (JARVIS / AIOS Architecture)

`MOTION / FORM` is designed as a reusable **Experience Module** running under the Experience Engine layer rather than replacing the parent AIOS/JARVIS shell:

```text
                    JARVIS / AIOS
                         │
                  EXPERIENCE ENGINE
                         │
        ┌────────────────┼────────────────┐
        │                │                │
   UAE WORLD       MOTION / FORM      OTHER 3D
     MODEL            MODULE         EXPERIENCES
        │                │
   spatial data     visual assets
        │                │
        └────────┬───────┘
                 ↓
           UNIFIED INPUT
      Voice / Vision / Gesture
                 ↓
        Unified Command Bus
```

### Clean Module Interface (`MotionFormExperienceModule`)

```tsx
import { MotionFormExperienceModule } from './components/MotionFormExperienceModule';
import { commandBus } from './services/commandBus';

<MotionFormExperienceModule
  initialExperienceId="future-city-block"
  onExperienceChange={(id) => console.log('Experience:', id)}
  onProgressChange={(progress) => console.log('Normalized Spatial Scrub:', progress)}
/>
```

### Unified Command Bus

All modalities (Voice, Vision Gestures, Keyboard, Mouse Wheel, Touch, API) converge on the unified command dispatcher:

```ts
// Open an experience
commandBus.dispatch({ type: 'OPEN_EXPERIENCE', payload: { id: 'kinetic-gt' } }, 'voice');

// Set exploded view progress (0.0 = Assembled, 0.5 = Halfway, 1.0 = Max Exploded)
commandBus.dispatch({ type: 'SET_PROGRESS', payload: { value: 0.5 } }, 'voice');

// Reset to assembled
commandBus.dispatch({ type: 'RESET_EXPERIENCE' }, 'voice');

// Exit
commandBus.dispatch({ type: 'CLOSE_EXPERIENCE' }, 'gesture');
```

---

## 2. Quick Start & Development

```bash
# Install dependencies
npm install

# Start development server (Port 3000)
npm run dev

# Compile production bundle
npm run build

# Start production server
npm start
```

---

## 3. Video Asset Specifications & Placement

Place your rendered 10-second 60fps 4K video files in the `public/assets/` directory (or `/assets/`):

1. **Card 01 (Kinetic GT):** `public/assets/kinetic-gt.mp4`
2. **Card 02 (Orbital Habitat):** `public/assets/orbital-habitat.mp4`
3. **Card 03 (Botanical Clock):** `public/assets/botanical-clock.mp4`
4. **Card 04 (Analogue Sound Machine):** `public/assets/analogue-sound-machine.mp4`
5. **Card 05 (Future City Block):** `public/assets/future-city-block.mp4`

### Mandatory Generative Video Directives
- **Camera:** Completely locked static perspective (no orbit, pan, zoom, or shake).
- **Transformation Timeline:**
  - `0.00s (0%)`: Fully assembled object/structure.
  - `1.00s–10.00s (10%–100%)`: Components separate along the designated disassembly axis into parallel floating layers.
- **Lighting & Aesthetics:** Dark slate / charcoal matte studio background, soft volumetric rim lighting, zero text overlay, zero background clutter.

> **Hardware-Accelerated 3D Fallback:** If local MP4 files are loading or not yet placed in the assets directory, the built-in procedural Canvas 3D engine renders multi-tier exploded geometry, depth offsets, and floating leader callouts in real time.

---

## 4. Optical Gesture Calibration & MediaPipe Vision Engine

The vision pipeline is powered by `@mediapipe/tasks-vision` and calibrated in `src/services/vision/handLandmarks.ts`:

- **Hand Scale Normalization:** Euclidean distance between **Wrist** (`landmark 0`) and **Middle MCP** (`landmark 9`).
- **Normalized Pinch Metric:** `distance(ThumbTip 4, IndexTip 8) / HandScale`.
- `minPinchThreshold: 0.20`: Fingers closed / touching $\rightarrow$ maps to `0%` (Fully Assembled).
- `maxPinchThreshold: 0.82`: Fingers spread wide apart $\rightarrow$ maps to `100%` (Fully Exploded).
- `smoothingAlpha: 0.28`: Exponential Moving Average (EMA) coefficient for responsive, jitter-free scrubbing.
- `palmHoldDurationMs: 450`: Continuous 5-finger extended hold required to enter the selected card.
- `triggerCooldownMs: 1400`: Cooldown to prevent rapid double activations.

---

## 5. Fallback Controls & Accessibility

If the webcam is disabled or hand tracking is not available:

- **Slider Scrubbing:** Drag the bottom technical range scrubber.
- **Mouse Wheel / Trackpad:** Scroll up/down to assemble or explode.
- **Keyboard Navigation:**
  - `[← / →]` : Switch cards in Gallery.
  - `[↑ / ↓]` : Scrub exploded timeline forward / backward.
  - `[SPACE / ENTER]` : Open active card.
  - `[ESC]` : Close full-screen experience and return to gallery.
  - `[R / 0 / Home]` : Instant reset to 0% Assembled.
  - `[1 / End]` : Jump to 100% Exploded view.
- **Layer Decomposition Drawer:** Click any layer in the right slide-over to jump directly to its separation tier.
- **Reduced Motion:** Adheres to CSS `prefers-reduced-motion` media queries.

---

## 6. Resource Management & Cleanup

All MediaPipe instances, camera video tracks, WebAssembly task runners, `requestAnimationFrame` render loops, and DOM event listeners are strictly disposed upon unmount to eliminate memory leaks and ensure no background camera activity remains when gesture mode is toggled off.
