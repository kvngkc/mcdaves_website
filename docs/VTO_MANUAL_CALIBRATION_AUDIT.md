# VTO Manual Calibration Architecture Audit

## Scope

This audit covers the current McDaves VTO lifecycle on `main` at commit `c84b8f2ff237345d15639ee08566b64a781c5035` and the components that participate in upload, storage, calibration, rendering, review, approval, publication, and storefront asset hydration.

## Locked product behavior

1. Admin can select an existing GLB or upload a new GLB.
2. Uploaded GLB is used as-is. No automatic geometry optimization, temple cutting, rescaling, or GLB export is performed.
3. Admin calibrates against the live webcam with the same MediaPipe + Three.js renderer used by customers.
4. Calibration changes are applied immediately in the preview.
5. Save persists calibration metadata only. The GLB bytes are not mutated.
6. Publish makes the saved GLB + saved calibration the authoritative storefront state.
7. The storefront must render the same GLB URL and calibration values saved by the admin editor.
8. Existing VTO lifecycle, storage bucket, variant linkage, authorization, and fail-closed behavior are preserved unless explicitly changed below.

## Current system inventory

| Area | Current implementation | Decision |
|---|---|---|
| Admin upload | `src/app/api/admin/vto/upload/route.ts` | **CHANGE**: remove requirement for catalog physical dimensions; create source asset ready for manual calibration. |
| Admin dashboard | `src/vto-pipeline/components/AdminPipelineDashboard.tsx` | **CHANGE**: replace upload/process/review UI with upload/select + live calibration studio + save/approve/publish workflow. |
| Processing route | `src/app/api/admin/vto/process/route.ts` | **REMOVE FROM ACTIVE FLOW**: manual calibration replaces server processing. Keep no automatic transform path. |
| Pipeline service | `src/vto-pipeline/backend/VTOPipelineService.ts` | **REMOVE/REPLACE**: no derived GLB generation or post-publication source deletion. Retain only shared verification helpers if needed. |
| GLB processor | `src/vto-pipeline/processor/VTOAssetProcessor.ts` | **REMOVE**: performs automatic bridge registration, scaling, temple processing, geometry merge/export. |
| Temple processor | `src/vto-pipeline/processor/TempleProcessor.ts` | **REMOVE FROM VTO FLOW**: manual calibration must never cut or alter geometry. |
| Inspector | `src/vto-pipeline/inspector/*` | **KEEP ONLY IF USED FOR NON-MUTATING VALIDATION**. It must not become an implicit transformation stage. |
| Validator | `src/vto-pipeline/validator/*` | **KEEP/ADAPT** for structural GLB validation before save/publish; validation must not fabricate dimensions. |
| Registry | `src/vto-pipeline/registry/VTOAssetRegistry.ts` | **KEEP**: remains runtime metadata registry and single storefront authority. |
| Calibration adapter | `src/vto-lab/calibration/calibrationRegistry.ts` | **CHANGE**: consume manual transform metadata and remove stale hard-coded catalog entries. |
| Model loader | `src/vto-lab/models/ModelLoader.ts` | **CHANGE**: no automatic temple clipping or hidden transform that contradicts saved calibration. |
| Runtime scale | `src/vto-lab/models/ModelCalibration.ts` | **CHANGE**: manual saved scale becomes authoritative instead of requiring fabricated/derived physical scale. |
| Runtime model | `src/vto-lab/models/GlassesModel.tsx` | **CHANGE**: accept calibration override for draft editor and apply exactly the persisted manual transform. |
| Renderer | `src/vto-lab/rendering/VTORenderer.tsx` | **CHANGE**: support draft calibration override without creating a second renderer. |
| Canvas | `src/vto-lab/components/VTOCanvas.tsx` | **CHANGE**: pass calibration override through to the shared renderer. |
| VTO lab | `src/vto-lab/VTOApp.tsx` | **KEEP/ADAPT**: existing camera + MediaPipe loop is the reference implementation for the admin studio. |
| Camera | `src/vto-lab/camera/*` | **KEEP**: reuse existing camera lifecycle. |
| Face tracking | `src/vto-lab/tracking/*` | **KEEP**: same detection contract in admin and storefront. |
| Pose | `src/vto-lab/pose/*` | **KEEP/ADAPT**: face pose remains the runtime base pose; manual calibration is an explicit overlay. |
| Storefront asset API | `/api/vto/assets` | **CHANGE**: expose the saved source/public GLB and manual calibration fields; do not require derived output metadata. |
| Publish route | `src/app/api/admin/vto/publish/route.ts` | **CHANGE**: verify uploaded source GLB, persist its public URL, preserve the source object, and publish saved calibration. |
| Variant linkage | `product_variants.vto_asset_id` | **KEEP**: remains the product/variant authority. |
| Storage | `vto-models` bucket | **KEEP**. Uploaded GLB becomes the production GLB. |
| DB calibration table | `vto_asset_calibrations` | **CHANGE MINIMALLY**: retain existing physical dimension and registration columns; add a JSON manual transform only where current columns cannot represent explicit editor state. |
| Output-size gate | migrations `009`, `011`, `012` | **RETIRED** as a publication requirement. Size remains observability data only. |
| Derived-asset publication constraint | migration `009` | **CHANGE**: published assets no longer require a derived object because the source upload is the production object. |
| Tests | `tests/vto_processor_contract.test.ts`, `tests/gate4_vto_integration.test.ts`, `src/vto-lab/models/ModelCalibration.test.ts` | **CHANGE**: replace processor/derived-asset assumptions with source-asset + manual-calibration invariants and storefront parity tests. |
| E2E | `e2e/storefront.spec.ts` | **CHANGE**: add end-to-end published calibration → storefront render regression. |
| CI | `.github/workflows/test.yml` | **KEEP/CHANGE** only as required to execute new tests. |

## Existing DB fields that remain useful

- `frame_width_mm`, `lens_width_mm`, `bridge_width_mm`, `temple_length_mm`: explicit optical/product measurements. They are metadata, not an automatic renderer command.
- `bridge_x`, `bridge_y`, `bridge_z`: existing registration data can remain for compatibility, but manual editor state must have an unambiguous meaning.
- `rotation_offset_euler`: existing rotation storage can remain and map to editor rotation.
- `measured_native_width`: retained for diagnostics/backward compatibility; it must not block a manually calibrated asset merely because it was not produced by the old processor.
- `width_multiplier`: retained for compatibility, but manual scale must be explicit and authoritative.
- `source_storage_path`: becomes the production GLB path instead of being deleted after publication.
- `vto_glb_url` / `storage_path`: point at the same uploaded production GLB after publication.
- `provenance`: retained for audit evidence.

## Architectural invariant

There must be exactly one production GLB for a VTO asset and one persisted calibration state for that GLB. The admin preview and storefront renderer must consume the same renderer, face-tracking contract, GLB URL, and calibration values.

No server-side step may silently modify the GLB between Save and Publish.
