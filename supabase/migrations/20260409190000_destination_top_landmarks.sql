alter table public.destinations
add column if not exists top_landmarks jsonb;
