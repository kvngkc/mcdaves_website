-- Gate 4 publication is based on verified derived-asset provenance.
-- Physical eyewear dimensions are not required merely to mark an asset PUBLISHED.
ALTER TABLE public.vto_asset_calibrations
  DROP CONSTRAINT IF EXISTS vto_asset_calibrations_published_check;
