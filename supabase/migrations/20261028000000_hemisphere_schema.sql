-- ==============================================================================
-- Hemisphere Schema: The Two-Minute Spread Physical Journal & Planner
-- Migration: 20261028000000_hemisphere_schema.sql
-- ==============================================================================

-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";

-- 2. ENUMS
do $$ begin
    create type public.time_scope as enum ('DAY', 'WEEK', 'MONTH');
exception
    when duplicate_object then null;
end $$;

-- 3. PLANNER EVENTS & MILESTONES (Left Panel)
create table if not exists public.events (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade,
    title text not null,
    description text,
    scope public.time_scope not null default 'DAY',
    start_time timestamptz not null,
    end_time timestamptz,
    is_milestone boolean default false not null,
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null
);

-- 4. NOTEBOOK TASKS & CHECKLISTS (Option A: Single Source of Truth)
create table if not exists public.tasks (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade,
    title text not null,
    scope public.time_scope not null default 'DAY',
    target_date date not null,
    is_completed boolean default false not null,
    completed_at timestamptz,
    sort_order integer default 0 not null,
    
    -- Option A: Temporal scheduling into Left Planner
    scheduled_time time,                    -- e.g., '11:30:00'
    duration_minutes integer default 30,    -- Duration block size in minutes
    
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null
);

-- 5. DAILY JOURNAL & ONE-LINE SUMMARIES
create table if not exists public.daily_logs (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade,
    log_date date not null,
    one_line_summary text,
    reflection_notes text,
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null,
    constraint unique_user_daily_log unique(user_id, log_date)
);

-- 6. HABIT TRACKING (Monthly Heatmaps)
create table if not exists public.habits (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade,
    name text not null,
    archived boolean default false not null,
    created_at timestamptz default now() not null
);

create table if not exists public.habit_logs (
    id uuid primary key default gen_random_uuid(),
    habit_id uuid references public.habits(id) on delete cascade not null,
    user_id uuid references auth.users(id) on delete cascade,
    log_date date not null,
    completed boolean default true not null,
    constraint unique_habit_daily_log unique(habit_id, log_date)
);

-- 7. PERFORMANCE INDEXES
create index if not exists idx_events_lookup on public.events(user_id, scope, start_time);
create index if not exists idx_tasks_lookup on public.tasks(user_id, scope, target_date, sort_order);
create index if not exists idx_tasks_scheduled on public.tasks(user_id, target_date, scheduled_time) where scheduled_time is not null;
create index if not exists idx_daily_logs_lookup on public.daily_logs(user_id, log_date);
create index if not exists idx_habit_logs_lookup on public.habit_logs(user_id, log_date);

-- 8. AUTOMATIC updated_at TRIGGER FUNCTION
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

drop trigger if exists set_events_updated_at on public.events;
create trigger set_events_updated_at
    before update on public.events
    for each row execute function public.handle_updated_at();

drop trigger if exists set_tasks_updated_at on public.tasks;
create trigger set_tasks_updated_at
    before update on public.tasks
    for each row execute function public.handle_updated_at();

drop trigger if exists set_daily_logs_updated_at on public.daily_logs;
create trigger set_daily_logs_updated_at
    before update on public.daily_logs
    for each row execute function public.handle_updated_at();

-- 9. ROW LEVEL SECURITY (RLS)
alter table public.events enable row level security;
alter table public.tasks enable row level security;
alter table public.daily_logs enable row level security;
alter table public.habits enable row level security;
alter table public.habit_logs enable row level security;

-- Policies for Authenticated & Demo Users
create policy "Users can access their own events"
    on public.events for all
    using (auth.uid() = user_id or auth.uid() is null);

create policy "Users can access their own tasks"
    on public.tasks for all
    using (auth.uid() = user_id or auth.uid() is null);

create policy "Users can access their own daily logs"
    on public.daily_logs for all
    using (auth.uid() = user_id or auth.uid() is null);

create policy "Users can access their own habits"
    on public.habits for all
    using (auth.uid() = user_id or auth.uid() is null);

create policy "Users can access their own habit logs"
    on public.habit_logs for all
    using (auth.uid() = user_id or auth.uid() is null);

-- 10. REALTIME PUBLICATION
-- Enable Supabase Realtime broadcast for instantaneous multi-client synchronisation
do $$ begin
    alter publication supabase_realtime add table public.events;
    alter publication supabase_realtime add table public.tasks;
    alter publication supabase_realtime add table public.daily_logs;
    alter publication supabase_realtime add table public.habits;
    alter publication supabase_realtime add table public.habit_logs;
exception
    when duplicate_object then null;
    when undefined_object then null;
end $$;
