-- Create profiles table
create table public.profiles (
  id uuid references auth.users not null primary key,
  username text unique not null,
  full_name text,
  avatar_url text,
  website text,
  bio text,
  location text,
  role text,
  skills text[],
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create projects table
create table public.projects (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) not null,
  title text not null,
  description text,
  category text,
  image_url text,
  link_url text,
  github_repo_id bigint,
  stargazers_count integer default 0,
  language text,
  created_at timestamptz default now()
);

-- Enable Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.projects enable row level security;

-- Create policies (modify as needed for your auth model)
-- Allow public read access to profiles
create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

-- Allow users to insert their own profile
create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

-- Allow users to update own profile
create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- Allow public read access to projects
create policy "Public projects are viewable by everyone."
  on projects for select
  using ( true );
