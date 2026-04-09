-- SeasonScout Phase 11.2 Home hero location metadata support
-- Assumptions:
-- 1. Home hero content remains a flexible JSON content slot.
-- 2. Location metadata is optional and should not block hero rendering when absent.

update public.site_content
set content = coalesce(content, '{}'::jsonb) || jsonb_build_object(
  'hero_image_location_label',
  coalesce(content -> 'hero_image_location_label', 'null'::jsonb)
)
where key = 'home-hero';
