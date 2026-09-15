-- Issue #3: physical dimensions are unknown until measured.
-- Existing values are preserved. Future product rows must not silently inherit
-- fabricated eyewear measurements from the database schema.
ALTER TABLE public.products
  ALTER COLUMN frame_width_mm DROP DEFAULT,
  ALTER COLUMN lens_width_mm DROP DEFAULT,
  ALTER COLUMN bridge_width_mm DROP DEFAULT,
  ALTER COLUMN temple_length_mm DROP DEFAULT,
  ALTER COLUMN frame_size DROP DEFAULT;

ALTER TABLE public.products
  ALTER COLUMN frame_width_mm DROP NOT NULL,
  ALTER COLUMN lens_width_mm DROP NOT NULL,
  ALTER COLUMN bridge_width_mm DROP NOT NULL,
  ALTER COLUMN temple_length_mm DROP NOT NULL,
  ALTER COLUMN frame_size DROP NOT NULL;
