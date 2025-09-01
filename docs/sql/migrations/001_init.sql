-- Initial Schema
create table if not exists reco_answers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  question text,
  answer text,
  created_at timestamp default now()
);

create table if not exists business_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  content jsonb,
  created_at timestamp default now()
);
