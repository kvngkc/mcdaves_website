# McDaves VTO Forensic Audit & Architecture Fix

## Executive diagnosis

The original VTO was **not a true 3D face-attached system** even though
it rendered a GLB with React Three Fiber.

The active path was:

`getUserMedia → <video> → Jeeliz FaceFilter → Jeeliz x/y/s/rotation → hard-coded Three.js frustum → GLB`

The dormant MediaPipe pipeline already had the correct architectural
ingredient --- `outputFacialTransformationMatrixes: true` --- but it was
never connected to the live renderer.

The fundamental failures were:

1.  **Depth was fabricated.** Z was a calibration constant while face
    distance was simulated with scale.
2.  **Scale was arbitrary.** `detectState.s * 2.5` had no relationship
    to the product's physical frame width.
3.  **The model pivot was displaced.** Large asset translations were
    applied at runtime instead of registering the asset around its
    bridge once.
4.  **Projection was hard-coded.** The active path used a 50° camera, a
    4:3 frustum and a synthetic Z plane.
5.  **The video and renderer did not share a guaranteed viewport.**
    `object-contain` could introduce letterboxing while the active
    renderer still used container-space assumptions.
6.  **Two face engines existed simultaneously.** MediaPipe was
    implemented but bypassed; Jeeliz was the actual production engine.
7.  **Occlusion was fake.** A sphere at a fixed Z was being used as a
    face occluder.
8.  **The GLB dimensions themselves are inconsistent.** The supplied
    `glasses.glb` is roughly 565 × 587 × 572 native units, while the
    Meshy cat-eye asset is roughly 2 × 0.747 × 1.891 native units. A
    single arbitrary runtime scale cannot correctly normalize both.

MediaPipe's face-transform architecture is specifically intended to
provide a metric 3D space with a right-handed coordinate system and a
camera at the origin looking down -Z; its facial transformation matrix
maps the canonical face model into the detected face. The canonical
model defines metric units in centimeters.
citeturn0search0turn3search1

## Phase 1 --- Actual execution-path audit

### Pre-fix path

1.  `src/hooks/useCamera.ts`
    -   Calls `navigator.mediaDevices.getUserMedia`.
    -   Requests `facingMode: user`, ideal 640×480.
    -   Stores the `MediaStream`.
    -   Correctly stops tracks on close/unmount.
2.  `src/components/try-on/TryOnShell.tsx`
    -   Binds the stream to `<video>`.
    -   Uses `object-contain`.
    -   Mirrors video using CSS `scaleX(-1)`.
    -   Starts Jeeliz when the VTO state enters the live AR states.
    -   Sends Jeeliz output to `useJeelizTransform`.
    -   Sends the resulting transform to `GlassesRenderer3D`.
3.  `src/hooks/useJeelizFaceFilter.ts`
    -   Dynamically imports `facefilter`.
    -   Produces:
        -   x
        -   y
        -   s
        -   rx
        -   ry
        -   rz
    -   No genuine camera-space metric depth is exposed to the renderer.
4.  `src/hooks/useJeelizTransform.ts`
    -   Hard-coded:
        -   FOV = 50°
        -   camera Z = 5
        -   aspect = 4:3
        -   base scale = 2.5
        -   target Z = calibration.zOffset
    -   Therefore the model's position was fundamentally screen/frustum
        driven.
5.  `src/components/try-on/GlassesRenderer3D.tsx`
    -   Creates a PerspectiveCamera at `[0,0,5]`.
    -   Renders the GLB into a transparent overlay.
    -   The canvas itself was not mirrored while the video was mirrored.
6.  `src/components/try-on/GlassesModel.tsx`
    -   Applied asset-specific runtime translations.
    -   Normalized model width to 1.
    -   Applied another arbitrary runtime scale.
    -   Added a fixed sphere occluder.
    -   Used Euler rotations.

### Dormant but architecturally better path

`src/hooks/useFaceDetection.ts` already configured:

-   `@mediapipe/tasks-vision`
-   local `/models/face_landmarker.task`
-   `runningMode: VIDEO`
-   `outputFacialTransformationMatrixes: true`

But it was never connected to `TryOnShell`.

`src/hooks/useGlassesMatrixTransform.ts` also attempted to use the
MediaPipe matrix, but it was itself incorrect for the live architecture
because it converted the bridge back into 2D NDC/frustum coordinates and
then restored a fixed Z. That meant the better detector was still being
fed into the old pseudo-3D projection model.

### Coordinate-system audit

  ----------------------------------------------------------------------------------
  Stage                   Original coordinate system         Problem
  ----------------------- ---------------------------------- -----------------------
  Camera frame            Native video pixels                Correct source

  MediaPipe landmarks     Normalized image coordinates       Correct

  Old landmark conversion `video.clientWidth/clientHeight`   Incorrect when CSS
                                                             dimensions differ from
                                                             intrinsic frame

  Jeeliz                  Normalized/NDC-like face           Not metric
                          coordinates                        

  Active X/Y mapping      Synthetic Three frustum            Hard-coded

  Active Z                Constant calibration value         Fake depth

  Three camera            50° / Z=5                          Did not correspond to
                                                             MediaPipe metric camera

  Video                   CSS `object-contain` + mirror      Could create letterbox

  Canvas                  Full container                     Could span a different
                                                             viewport than the video

  GLB                     Local arbitrary asset units        No physical frame-size
                                                             normalization

  Occlusion               Fixed sphere                       Not a face surface
  ----------------------------------------------------------------------------------

The old MediaPipe matrix hook contained letterbox compensation logic,
but it was not the active transform path, so its existence did not
protect the production VTO.

## Phase 2 --- Architecture rebuilt

### New path

`getUserMedia → video → MediaPipe FaceLandmarker → facialTransformationMatrix → metric bridge position + quaternion → physically calibrated GLB → PerspectiveCamera → mirrored canvas`

### 1. True 6-DOF pose

The new renderer consumes `latestResultRef.current.faceMatrix`.

The matrix is decomposed into:

-   translation
-   quaternion
-   scale

The canonical MediaPipe bridge landmark is transformed through the
matrix:

`canonical landmark 168 → runtime metric bridge position`

This removes the need to infer bridge position from CSS pixels.

MediaPipe documents the transformation matrix as the mapping from
canonical face coordinates to the detected face, specifically for
applying effects to the detected landmarks.
citeturn3search0turn3search2

### 2. Real depth

The GLB is now placed at the transformed metric bridge position.

There is no:

-   `targetZ = -0.05`
-   fixed Z calibration slider
-   `detectState.s * 2.5`
-   screen-space scale pretending to be depth.

The perspective camera creates the apparent size change as the metric
face position changes.

This is still monocular estimated 3D --- it is not hardware depth
sensing --- but it is the correct AR architecture for MediaPipe's metric
face-transform pipeline.

### 3. Real physical scale

The product's optical frame size is parsed:

`52□18-140 → 52 + 52 + 18 = 122 mm`

That becomes:

`12.2 cm`

The loaded GLB's measured native width is obtained from its bounding
box.

Runtime scale is:

`physicalFrameWidthCm / measuredModelWidth`

Therefore:

-   a 52□18 frame gets its own physical width
-   a 58□14 frame gets its own physical width
-   moving toward the camera changes apparent size through perspective
-   moving away changes apparent size through perspective

No user-distance scale multiplier is involved.

### 4. Bridge registration

The old runtime anchor system has been removed from the transform
pipeline.

The model is cloned once, shifted into bridge-centered local space, and
its bounding box is measured after registration.

The important distinction is:

**asset registration happens once; face positioning happens every
frame.**

The registry no longer contains runtime X/Y/Z offsets, camera offsets or
Euler corrections.

### 5. Selfie mirror

The camera feed and 3D canvas are now mirrored together.

This is deliberate.

MediaPipe sees the underlying unmirrored video frame. The entire visual
result is then mirrored for the user's selfie view, keeping:

-   translation
-   rotation
-   yaw
-   roll

in the same displayed coordinate convention.

### 6. Letterbox/contain handling

The camera stage now calculates the actual `object-contain` rectangle.

Both:

-   video
-   3D renderer

are placed inside the same calculated viewport.

Therefore a 16:9 camera inside a 4:3 stage produces matching pillarboxes
rather than a coordinate drift.

### 7. Camera projection

The Three.js camera is now:

-   at `[0,0,0]`
-   looking down `-Z`
-   perspective
-   dynamically configured from the actual video dimensions

The vertical FOV follows the MediaPipe face-geometry projection
convention:

`fovY = 2 atan(frameHeight / (2 × frameWidth))`

The older synthetic `cameraZ=5`, `frustumWidth=frustumHeight*4/3` path
is gone.

MediaPipe's metric-space documentation explicitly describes the virtual
camera at the origin looking down the negative Z axis and recommends
matching the virtual camera parameters to the real camera where
possible. citeturn0search0turn3search8

### 8. Occlusion

The artificial sphere has been removed.

It was not a face mesh and could not provide reliable occlusion.

The model now uses the real camera-space depth buffer and the actual
eyewear geometry. A future Phase 2 occlusion enhancement can add a
468/478-point MediaPipe face mesh depth-only surface, but that should be
implemented from the actual detected mesh topology rather than another
geometric approximation.

## Phase 3 --- Integration audit

### Routing

`/try-on/` remains an App Router route.

The 3D renderer is still dynamically imported with SSR disabled, which
is correct because WebGL/browser APIs cannot run during server
rendering.

### State

The previous per-frame React transform state has been removed.

The detector writes to a mutable ref:

`latestResultRef`

The R3F render loop consumes that ref directly.

React only receives low-frequency state changes such as:

-   model ready
-   face found
-   face lost
-   error

This materially reduces unnecessary React renders.

### Detection loop

The detector:

-   runs only when the video frame changes
-   uses `requestAnimationFrame`
-   publishes UI state at 10 Hz
-   feeds the renderer at render-frame rate

### Cleanup

The new path explicitly stops:

-   animation frame loop
-   MediaPipe detection
-   camera tracks

when the modal closes/unmounts.

### Model errors

A React error boundary now catches 3D asset loading/render errors and
returns control to the existing Photo fallback state.

### GPU fallback

MediaPipe first attempts GPU delegation and retries with CPU if GPU
initialization fails.

This is important for browsers/devices where WebGL/GPU delegate support
is unavailable or unstable.

## Phase 4 --- broader audit

### Security

#### Patched

1.  **Credential exposure**
    -   The supplied `.env.local` contained a Paystack secret key.
    -   It has been removed from the fixed codebase archive.
    -   `.env.example` now contains empty placeholders.

**Action required:** rotate/revoke the exposed Paystack credentials.
Even though they were test credentials, treat them as compromised.

2.  **JSON-LD injection hardening**
    -   Product JSON-LD is static today.
    -   The serializer is now escaped for `<` before injection.
3.  **Security headers** Added:
    -   X-Content-Type-Options
    -   X-Frame-Options
    -   Referrer-Policy
    -   Permissions-Policy
    -   Content-Security-Policy
4.  **Camera permissions**
    -   Permissions-Policy explicitly allows camera only for the same
        origin.
    -   Microphone and geolocation are denied.

#### Not fully verifiable in the sandbox

A live `npm audit` could not complete because the sandbox could not
reach `registry.npmjs.org`. Therefore no claim is made that the
dependency tree is vulnerability-free.

The source was also scanned for: - embedded AWS-style keys - Google API
keys - Paystack secret/public key literals - `eval` - `new Function` -
`innerHTML` - `dangerouslySetInnerHTML`

Only the intended JSON-LD injection remained, and it was hardened.

### SEO

Added:

-   `src/app/robots.ts`
-   `src/app/sitemap.ts`

Improved:

-   root metadata
-   product metadata
-   removal of fake Google verification placeholder
-   product JSON-LD hardening
-   existing SSR/static product pages preserved

There is no traditional `index.html` to patch because this is a Next.js
App Router application; document metadata belongs in
`src/app/layout.tsx` and route metadata.

### UI/UX

Improved VTO:

-   clearer initialization state
-   explicit model-load failure
-   explicit camera denial path
-   Photo fallback preserved
-   calibrated 3D debug HUD
-   3D debug now shows metric tracking information rather than obsolete
    Jeeliz values
-   mobile-friendly camera viewport remains intact
-   existing Modal focus trap and Escape behavior were preserved

### Performance

Improved:

-   removed Jeeliz runtime dependency
-   removed duplicate face-engine initialization
-   removed obsolete transform hooks
-   removed per-frame React transform state
-   detector publishes UI state only at 10 Hz
-   R3F consumes a mutable detection ref
-   model remains dynamically loaded
-   Next image optimization re-enabled
-   unnecessary bundled `next-16.3.0.tgz` removed from the project
    archive
-   build artifact/cache metadata removed from the archive

## Files deleted

These were dead or conflicting VTO paths:

-   `src/hooks/useJeelizFaceFilter.ts`
-   `src/hooks/useJeelizTransform.ts`
-   `src/hooks/useGlassesMatrixTransform.ts`
-   `src/hooks/useGlassesTransform.ts`
-   `src/hooks/useSmoothLandmarks.ts`
-   `src/hooks/useTryOn.ts`
-   `src/types/facefilter.d.ts`
-   `src/components/try-on/GlassesRenderer2D.tsx`
-   `src/components/try-on/GlassesRenderer.tsx`

The Photo fallback still uses its own 2D canvas implementation because
it is a separate product fallback feature, not part of the live AR
engine.

## File replacement map

  -----------------------------------------------------------------------
  Old                                 New
  ----------------------------------- -----------------------------------
  Jeeliz FaceFilter                   MediaPipe FaceLandmarker

  `useJeelizFaceFilter.ts`            `useFaceDetection.ts`

  `useJeelizTransform.ts`             Matrix consumed directly by 3D
                                      renderer

  `useGlassesMatrixTransform.ts`      Removed; no NDC/frustum transform
                                      layer

  `GlassesModel.tsx`                  Metric-space bridge-anchored model

  `GlassesRenderer3D.tsx`             Metric camera + shared mirrored
                                      viewport

  `calibration.ts`                    Asset registration + physical frame
                                      width parser

  `TryOnShell.tsx`                    Single-engine VTO lifecycle

  `.env.local` in archive             Removed

  `.env.example`                      Added

  `robots.txt`                        `src/app/robots.ts`

  `sitemap.xml`                       `src/app/sitemap.ts`
  -----------------------------------------------------------------------

## Calibration instructions

### Model registration

For each new GLB:

1.  Open the GLB in Blender.
2.  Identify the exact physical nose-bridge contact point.
3.  Record that point in the model's native coordinates.
4.  Put that point in `GLASSES_CALIBRATION_REGISTRY`.
5.  Do not add runtime screen offsets.
6.  Do not add a Z-distance correction.
7.  Do not add a face-distance scale multiplier.

### Physical width

The product's `frameSize` must use standard optical notation.

Example:

`52□18-140`

means:

-   lens = 52 mm
-   bridge = 18 mm
-   temple = 140 mm
-   overall front width = 122 mm

The runtime scale uses the first two measurements.

### Width multiplier

Start at:

`1.0`

Only change it if the GLB's modeled outer width does not represent the
physical product width.

This is an **asset calibration parameter**, not a runtime tracking hack.

### What to tune first

If the frame is:

-   too wide at every distance → correct GLB geometry or widthMultiplier
-   too high/low → correct the GLB bridge registration
-   drifting sideways when turning → investigate matrix/model
    orientation, not X offset
-   changing apparent size incorrectly with distance → investigate
    camera projection/model depth, not scale
-   rotating around an external point → the bridge registration is wrong

Do not reintroduce runtime X/Y/Z sliders.

## Debug mode

Open `/try-on/`, select a 3D-enabled product, then click `3D Debug`.

The HUD reports:

-   face lock
-   video resolution
-   IPD in source pixels
-   matrix Z translation
-   yaw
-   pitch
-   roll

The model debug marker shows:

-   bridge origin
-   XYZ axes

### Interpretation

If matrix Z changes when you move toward/away from the camera, the depth
pipeline is alive.

If the glasses remain visually constant in screen size while matrix Z
changes, the problem is projection/model scale.

If matrix yaw changes but the glasses orbit around an external point,
the problem is asset registration.

If everything moves correctly before turning on selfie mirroring but
fails after mirroring, inspect the CSS mirror wrapper first.

## Troubleshooting

### Glasses too small

Do not change tracking scale.

Check:

1.  Product `frameSize`.
2.  GLB outer width.
3.  Model bridge registration.
4.  `widthMultiplier`.

### Glasses too far from the face

Do not add a fixed Z offset.

The bridge position comes from the MediaPipe facial transformation
matrix. If depth is wrong, investigate camera projection/metric-space
alignment.

### Glasses face backward

Correct the GLB's local orientation in the asset itself or add a
documented asset orientation calibration. Do not invert yaw inside the
tracker.

### Glasses flip on selfie view

Verify that both the `<video>` and 3D canvas are mirrored together.

### Model fails to load

The error boundary should transition to Photo mode. Verify:

-   `/models/glasses.glb` exists
-   `frameSize` exists
-   the GLB is valid
-   browser WebGL is available

### MediaPipe fails

The engine tries GPU first and CPU second. Verify:

-   `/models/face_landmarker.task`
-   network access to the MediaPipe WASM assets
-   browser WebAssembly support

### Camera permission fails

Use Photo mode, then check browser site permissions and HTTPS.

## Validation status

### Completed against the supplied source

-   full VTO import/execution graph mapped
-   active/dormant engine conflict identified
-   hard-coded Z removed
-   hard-coded 4:3 frustum transform removed
-   Jeeliz dependency removed
-   MediaPipe matrix pipeline activated
-   metric bridge anchoring implemented
-   physical frame-width scaling implemented
-   shared letterbox viewport implemented
-   selfie mirror aligned
-   sphere occluder removed
-   detection/render loop decoupled from React state
-   model-load error boundary added
-   GPU→CPU detector fallback added
-   camera cleanup reviewed
-   JSON-LD hardened
-   CSP/security headers added
-   robots/sitemap added
-   secret removed from fixed archive
-   old VTO dead code removed
-   product catalog/photo fallback/cart architecture preserved

### Environment limitation

A full `npm ci` / `npm run type-check` could not be completed in this
sandbox because:

1.  an intermediate `node_modules` install hit filesystem permission
    problems, and
2.  a clean dependency installation could not finish within the sandbox
    execution window,
3.  `npm audit` could not contact the npm registry.

The source import graph was re-scanned after the deletions and currently
has **no unresolved local imports**.

For final verification on the developer machine, run:

``` bash
npm ci
npm run type-check
npm run build
```

Then test the VTO at:

-   frontal
-   15° yaw
-   30° yaw
-   45° yaw
-   pitch up/down
-   roll left/right
-   move toward camera
-   move away from camera
-   partial face loss
-   camera permission denial
-   mobile Safari/Chrome
-   desktop Chrome/Edge

## What was rebuilt vs preserved

### Rebuilt

The entire live VTO transform architecture.

### Preserved

-   product catalog
-   product detail pages
-   cart
-   checkout/payment flow
-   B2B pages
-   Photo fallback
-   Modal/focus trap
-   existing application routing
-   existing site shell
-   existing product data

### Still worth a future VTO phase

A proper MediaPipe face-depth occlusion mesh should be added once the
current metric-space alignment is validated. The official Face Transform
architecture uses a face mesh rendered into the depth buffer before the
virtual object to create realistic occlusion. citeturn0search0

That should be **Phase 2 after validation**, not another fake sphere.

## Complete replacement files

The fixed project archive contains the complete final versions of every
changed file under the paths shown above. The archive also contains the
regenerated `package-lock.json`, so it is the authoritative source for
installation.
