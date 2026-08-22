# ArchOS Hand-Led Interface Control

The ArchOS spatial interface can use the camera as an optional input device. The camera feed is converted into hand landmarks by a vision model; the UI consumes normalized interaction state rather than raw video.

## Interaction model

- **Index finger** → spatial cursor / focus ray.
- **Pinch (thumb + index)** → select, grab, confirm.
- **Open hand** → neutral/navigation state.
- **Fist** → reserved for future lock/hold interaction.
- **Swipe** → reserved for camera-space navigation gestures.

## Architecture

`Camera → MediaPipe vision worker → 21 hand landmarks → HandControlController → Spatial/UI command bus → World Model`

The controller intentionally does not import MediaPipe. This keeps inference replaceable and prevents camera/model work from entering the render hot path.

## Why this fits the ArchOS interface

The black-hole center remains the primary spatial anchor. A pointing hand moves the focus across modules/nodes; pinching commits an interaction. The same input can later drive camera orbit, node inspection, module activation, timeline scrubbing, and 3D object manipulation.

## Performance rules

- Run vision inference off the main render path where possible.
- Do not render the camera texture unless explicitly requested.
- Feed only landmark/state deltas into the UI.
- Smooth cursor movement to suppress landmark jitter.
- Gate interactions behind confidence thresholds.
- Keep hand tracking optional so keyboard/mouse/touch remain available.
