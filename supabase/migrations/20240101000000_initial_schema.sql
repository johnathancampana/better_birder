-- Better Birder — Initial Database Schema
-- Run via Supabase CLI: supabase db push

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ============================================================
-- User profiles (extends Supabase auth.users)
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text not null default '',
  current_streak integer not null default 0,
  longest_streak integer not null default 0,
  last_activity_date date,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- Life list entries
-- ============================================================
create table public.life_list_entries (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  species_code text not null,
  common_name text not null,
  scientific_name text not null default '',
  date_first_seen date,
  location text not null default '',
  notes text not null default '',
  photo_url text,
  mastery_score integer not null default 0 check (mastery_score >= 0 and mastery_score <= 100),
  added_at timestamptz not null default now(),

  unique (user_id, species_code)
);

alter table public.life_list_entries enable row level security;

create policy "Users can view own life list"
  on public.life_list_entries for select
  using (auth.uid() = user_id);

create policy "Users can insert own life list entries"
  on public.life_list_entries for insert
  with check (auth.uid() = user_id);

create policy "Users can update own life list entries"
  on public.life_list_entries for update
  using (auth.uid() = user_id);

create policy "Users can delete own life list entries"
  on public.life_list_entries for delete
  using (auth.uid() = user_id);

-- ============================================================
-- Quiz sessions
-- ============================================================
create table public.quiz_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  score integer not null default 0,
  xp_earned integer not null default 0
);

alter table public.quiz_sessions enable row level security;

create policy "Users can view own quiz sessions"
  on public.quiz_sessions for select
  using (auth.uid() = user_id);

create policy "Users can insert own quiz sessions"
  on public.quiz_sessions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own quiz sessions"
  on public.quiz_sessions for update
  using (auth.uid() = user_id);

-- ============================================================
-- Quiz questions
-- ============================================================
create table public.quiz_questions (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid not null references public.quiz_sessions(id) on delete cascade,
  question_type text not null check (question_type in (
    'identify_by_image', 'identify_by_sound', 'match_description',
    'odd_one_out', 'range_question', 'fact_check'
  )),
  species_code text not null,
  prompt text not null,
  answer_options jsonb not null default '[]',
  correct_answer text not null,
  user_answer text,
  is_correct boolean,
  time_spent_ms integer,
  media_url text
);

alter table public.quiz_questions enable row level security;

create policy "Users can view own quiz questions"
  on public.quiz_questions for select
  using (
    session_id in (
      select id from public.quiz_sessions where user_id = auth.uid()
    )
  );

create policy "Users can insert own quiz questions"
  on public.quiz_questions for insert
  with check (
    session_id in (
      select id from public.quiz_sessions where user_id = auth.uid()
    )
  );

create policy "Users can update own quiz questions"
  on public.quiz_questions for update
  using (
    session_id in (
      select id from public.quiz_sessions where user_id = auth.uid()
    )
  );

-- ============================================================
-- Species mastery (spaced repetition tracking)
-- ============================================================
create table public.species_mastery (
  user_id uuid not null references public.profiles(id) on delete cascade,
  species_code text not null,
  times_seen_in_quiz integer not null default 0,
  times_correct integer not null default 0,
  last_seen_in_quiz timestamptz,
  mastery_score integer not null default 0 check (mastery_score >= 0 and mastery_score <= 100),
  next_review_date date not null default current_date,

  primary key (user_id, species_code)
);

alter table public.species_mastery enable row level security;

create policy "Users can view own mastery"
  on public.species_mastery for select
  using (auth.uid() = user_id);

create policy "Users can insert own mastery"
  on public.species_mastery for insert
  with check (auth.uid() = user_id);

create policy "Users can update own mastery"
  on public.species_mastery for update
  using (auth.uid() = user_id);

-- ============================================================
-- Push subscriptions (for streak reminders)
-- ============================================================
create table public.push_subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  subscription jsonb not null,
  created_at timestamptz not null default now(),

  unique (user_id)
);

alter table public.push_subscriptions enable row level security;

create policy "Users can manage own push subscriptions"
  on public.push_subscriptions for all
  using (auth.uid() = user_id);

-- ============================================================
-- Indexes
-- ============================================================
create index idx_life_list_user on public.life_list_entries(user_id);
create index idx_life_list_mastery on public.life_list_entries(user_id, mastery_score);
create index idx_quiz_sessions_user on public.quiz_sessions(user_id);
create index idx_quiz_questions_session on public.quiz_questions(session_id);
create index idx_species_mastery_review on public.species_mastery(user_id, next_review_date);
