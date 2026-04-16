-- Supabase SQL Schema for Blockchain Certificate Verification

-- Create the activities table
create table public.activities (
  id uuid default gen_random_uuid() primary key,
  action text not null,
  details text not null,
  url text,
  timestamp timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Note: Ensure Row Level Security (RLS) is disabled or properly configured so the client can insert rows.
-- If you want to disable RLS for rapid development:
alter table public.activities disable row level security;
