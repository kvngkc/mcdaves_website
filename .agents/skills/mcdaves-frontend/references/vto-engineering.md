# VTO Engineering Guidelines

The Virtual Try-On (VTO) system is a highly specialized real-time 3D pipeline. Changes require extreme care.

## Architecture
```
src/vto-lab/
├── VTOApp.tsx                    ← Standalone lab app (development)
├── tracking/
│   ├── FaceLandmarker.ts         ← MediaPipe initialization & landmark processing
│   └── FaceTrackingTypes.ts      ← All VTO domain types
├── rendering/
│   └── VTORenderer.tsx           ← Three.js Canvas + scene graph
├── models/
│   ├── GlassesModel.tsx          ← GLB eyewear component (pose-following)
│   ├── HeadOccluder.tsx          ← Depth-only head volume (occlusion)
│   ├── PosePrimitive.tsx         ← Debug axes/cube
│   └── ModelLoader.ts            ← GLB preparation & material cloning
├── pose/
│   ├── CoordinateTransform.ts    ← MediaPipe matrix → Three.js metric space
│   └── FacePose.ts               ← Smoothing filter (position/quaternion/scale)
├── calibration/
│   └── calibrationRegistry.ts    ← Per-model physical size calibration
├── camera/
│   └── CameraController.ts       ← getUserMedia lifecycle
├── components/
│   ├── VTOCanvas.tsx             ← Letterbox-aligned canvas wrapper
│   └── VTOVideo.tsx              ← Camera feed video element
└── hooks/                        ← Shared React hooks
```

Consumer-facing integration: `src/components/try-on/VTOModal.tsx`

## Core Directives

### 1. Face Tracking
- The system uses MediaPipe's 468-point Face Landmarker in VIDEO mode.
- The `facialTransformationMatrixes` output provides a 4×4 column-major matrix in centimeters.
- Do NOT alter `CoordinateTransform.ts` without proving the mathematical correctness of any change.

### 2. Render Loop
- `VTORenderer.tsx` renders at `frameloop="always"` (60 FPS).
- `useFrame` hooks in `GlassesModel.tsx` and `HeadOccluder.tsx` read from a mutable `detectionRef` for zero-latency updates.
- **NEVER** allocate objects (new Vector3, new Quaternion) inside `useFrame`. Use refs.
- **NEVER** call `setState` inside `useFrame` — it triggers re-renders.

### 3. Occlusion & Depth
- `HeadOccluder.tsx` writes invisible geometry into the depth buffer with `colorWrite={false}`.
- It uses `renderOrder={-1}` to guarantee depth writes happen before glasses rendering.
- The occluder consists of: rear cranium sphere, jaw cylinder, left/right ear spheres.
- Do NOT change `renderOrder` values without understanding the full render pipeline.

### 4. GLB Asset Pipeline
- Models are loaded via `useGLTF` from `@react-three/drei`.
- `ModelLoader.ts` clones materials (not geometry) to prevent shared-state bugs.
- `calibrationRegistry.ts` maps each GLB path to physical measurements for size calibration.
- When adding a new GLB model: add a calibration entry AND a `useGLTF.preload()` call.

### 5. Mobile GPU Constraints
- Keep GLB files under 2MB.
- Minimize draw calls — the occluder uses simple primitives for this reason.
- MediaPipe falls back from GPU to CPU delegate automatically if GPU fails.
- Camera permission denial must show a clear fallback UI (handled in `VTOModal.tsx`).
