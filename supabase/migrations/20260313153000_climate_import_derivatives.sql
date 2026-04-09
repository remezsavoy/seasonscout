-- SeasonScout Phase 10.7 climate import derivative helpers
-- Assumptions:
-- 1. Monthly climate imports should update backend-owned derived fields instead of leaving scoring logic in Edge Functions.
-- 2. Climate imports may mark destinations as importing while a backend workflow is in flight.
-- 3. Best-month selection should stay centralized in Postgres so destination reads consume cached values.

alter table public.destinations
  drop constraint if exists destinations_climate_import_status_valid;

alter table public.destinations
  add constraint destinations_climate_import_status_valid
  check (climate_import_status in ('pending', 'importing', 'imported', 'failed'));

comment on column public.destinations.climate_import_status
is 'Backend-owned monthly climate ingestion status. Pending destinations are eligible for import, importing destinations are in-flight, imported destinations have stored monthly climate rows, and failed destinations need backend attention or an explicit override.';

create or replace function public.compute_comfort_score(
  p_avg_high_c numeric,
  p_avg_low_c numeric,
  p_avg_precip_mm numeric default null,
  p_avg_humidity numeric default null,
  p_sunshine_hours numeric default null
)
returns numeric
language sql
immutable
as $$
  with inputs as (
    select
      (p_avg_high_c + p_avg_low_c) / 2.0 as average_temp_c,
      p_avg_precip_mm as avg_precip_mm,
      p_avg_humidity as avg_humidity,
      p_sunshine_hours as sunshine_hours
  ),
  component_scores as (
    select
      greatest(0::numeric, 100 - abs(average_temp_c - 21) * 6) as temp_score,
      case
        when avg_precip_mm is null then 70::numeric
        when avg_precip_mm <= 30 then 100::numeric
        when avg_precip_mm <= 60 then 100 - ((avg_precip_mm - 30) * 0.5)
        when avg_precip_mm <= 120 then 85 - ((avg_precip_mm - 60) * (40.0 / 60.0))
        when avg_precip_mm <= 200 then 45 - ((avg_precip_mm - 120) * 0.25)
        else 20::numeric
      end as precip_score,
      case
        when avg_humidity is null then 70::numeric
        when avg_humidity between 35 and 65 then 100::numeric
        when avg_humidity < 35 then greatest(45::numeric, 100 - ((35 - avg_humidity) * 2))
        else greatest(20::numeric, 100 - ((avg_humidity - 65) * 2.25))
      end as humidity_score,
      case
        when sunshine_hours is null then 70::numeric
        when sunshine_hours between 4 and 9 then 100::numeric
        when sunshine_hours < 4 then greatest(30::numeric, 100 - ((4 - sunshine_hours) * 15))
        else greatest(40::numeric, 100 - ((sunshine_hours - 9) * 10))
      end as sunshine_score
    from inputs
  )
  select round(
    least(
      100::numeric,
      greatest(
        0::numeric,
        (temp_score * 0.45)
        + (precip_score * 0.25)
        + (humidity_score * 0.15)
        + (sunshine_score * 0.15)
      )
    ),
    2
  )
  from component_scores;
$$;

comment on function public.compute_comfort_score(numeric, numeric, numeric, numeric, numeric)
is 'Backend-owned comfort score helper for stored monthly climate rows. Temperature has the highest weight, with precipitation, humidity, and sunshine adjusting the final value.';

create or replace function public.map_comfort_score_to_label(p_comfort_score numeric)
returns text
language sql
immutable
as $$
  select case
    when p_comfort_score is null then null
    when p_comfort_score >= 80 then 'Ideal'
    when p_comfort_score >= 65 then 'Good'
    when p_comfort_score >= 50 then 'Okay'
    else 'Avoid'
  end;
$$;

comment on function public.map_comfort_score_to_label(numeric)
is 'Maps a backend-owned comfort score into the presentation label stored on monthly_climate rows.';

create or replace function public.compute_best_months(p_destination_id uuid)
returns smallint[]
language sql
stable
as $$
  with scored_months as (
    select
      climate.month,
      coalesce(
        climate.comfort_score,
        public.compute_comfort_score(
          climate.avg_high_c,
          climate.avg_low_c,
          climate.avg_precip_mm,
          climate.avg_humidity,
          climate.sunshine_hours
        )
      ) as comfort_score
    from public.monthly_climate as climate
    where climate.destination_id = p_destination_id
  ),
  score_summary as (
    select
      max(comfort_score) as peak_score,
      count(*) as row_count
    from scored_months
  ),
  ranked_months as (
    select
      month,
      comfort_score,
      row_number() over (order by comfort_score desc, month asc) as score_rank
    from scored_months
  ),
  candidate_months as (
    select ranked.month, ranked.score_rank
    from ranked_months as ranked
    cross join score_summary as summary
    where summary.row_count > 0
      and ranked.comfort_score >= greatest(70::numeric, summary.peak_score - 7)
  ),
  selected_months as (
    select month
    from candidate_months
    where score_rank <= 6

    union

    select month
    from ranked_months
    where not exists (select 1 from candidate_months)
      and score_rank <= 3
  )
  select coalesce(array_agg(month order by month), '{}'::smallint[])
  from selected_months;
$$;

comment on function public.compute_best_months(uuid)
is 'Selects a backend-owned best-month window from monthly climate scores using a minimum threshold, near-peak tolerance, and a small cap on the final month count.';

create or replace function public.refresh_destination_climate_derivatives(p_destination_id uuid)
returns table(best_months smallint[], climate_row_count integer)
language plpgsql
as $$
declare
  v_best_months smallint[] := '{}'::smallint[];
  v_climate_row_count integer := 0;
begin
  update public.monthly_climate as climate
  set
    comfort_score = public.compute_comfort_score(
      climate.avg_high_c,
      climate.avg_low_c,
      climate.avg_precip_mm,
      climate.avg_humidity,
      climate.sunshine_hours
    ),
    recommendation_label = public.map_comfort_score_to_label(
      public.compute_comfort_score(
        climate.avg_high_c,
        climate.avg_low_c,
        climate.avg_precip_mm,
        climate.avg_humidity,
        climate.sunshine_hours
      )
    )
  where climate.destination_id = p_destination_id;

  select count(*)
  into v_climate_row_count
  from public.monthly_climate
  where destination_id = p_destination_id;

  if v_climate_row_count > 0 then
    v_best_months := public.compute_best_months(p_destination_id);
  end if;

  update public.destinations
  set best_months = coalesce(v_best_months, '{}'::smallint[])
  where id = p_destination_id;

  return query
  select coalesce(v_best_months, '{}'::smallint[]), v_climate_row_count;
end;
$$;

comment on function public.refresh_destination_climate_derivatives(uuid)
is 'Recomputes comfort scores, recommendation labels, and cached destination best_months after a backend climate import writes monthly rows.';
