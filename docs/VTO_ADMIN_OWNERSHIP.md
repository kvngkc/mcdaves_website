# VTO ownership boundary

## Admin repository owns

- GLB upload and storage registration
- VTO asset creation and naming
- variant selection and linkage evidence
- manual calibration values
- approval lifecycle
- publication lifecycle
- production GLB verification and hashing
- VTO asset management UI
- all authoring/inspection/calibration management routes

## Storefront repository owns

- read-only retrieval of published VTO assets
- customer camera access
- MediaPipe face tracking
- Three.js/R3F rendering
- customer Try On UI
- consumption of the published GLB and persisted `manual_transform`

The storefront must not create, upload, calibrate, approve, publish, or mutate VTO assets.

The uploaded GLB is the production GLB. Manual calibration is metadata only and must never rewrite or replace the source object.
