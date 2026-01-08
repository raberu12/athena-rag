-- Supabase Database Schema for Athena RAG Chatbot
-- Run this in the Supabase SQL Editor

-- Enable pgvector extension (required for embeddings)
create extension if not exists vector;

-- Profiles table (linked to auth.users)
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  display_name text,
  created_at timestamp with time zone default now()
);

-- Conversations table
create table if not exists conversations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  title text not null default 'New Chat',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Messages table
create table if not exists messages (
  id uuid default gen_random_uuid() primary key,
  conversation_id uuid references conversations(id) on delete cascade not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamp with time zone default now()
);

-- Documents table (metadata only, files in Storage)
create table if not exists documents (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  name text not null,
  size_bytes integer not null,
  page_count integer,
  storage_path text,
  created_at timestamp with time zone default now()
);

-- Document chunks with embeddings
create table if not exists document_chunks (
  id uuid default gen_random_uuid() primary key,
  document_id uuid references documents(id) on delete cascade not null,
  content text not null,
  chunk_index integer not null,
  start_char integer not null,
  end_char integer not null,
  embedding vector(1536) -- OpenAI text-embedding-3-small dimension
);

-- Index for vector similarity search
create index if not exists document_chunks_embedding_idx 
  on document_chunks using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- Row Level Security (RLS)
alter table profiles enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;
alter table documents enable row level security;
alter table document_chunks enable row level security;

-- RLS Policies for profiles
create policy "Users can view own profile" 
  on profiles for select 
  using (auth.uid() = id);

create policy "Users can update own profile" 
  on profiles for update 
  using (auth.uid() = id);

-- Allow the signup trigger to insert profiles
create policy "Allow profile creation on signup"
  on profiles for insert
  with check (true);

-- RLS Policies for conversations
create policy "Users can view own conversations" 
  on conversations for select 
  using (auth.uid() = user_id);

create policy "Users can create own conversations" 
  on conversations for insert 
  with check (auth.uid() = user_id);

create policy "Users can update own conversations" 
  on conversations for update 
  using (auth.uid() = user_id);

create policy "Users can delete own conversations" 
  on conversations for delete 
  using (auth.uid() = user_id);

-- RLS Policies for messages
create policy "Users can view messages in own conversations" 
  on messages for select 
  using (conversation_id in (select id from conversations where user_id = auth.uid()));

create policy "Users can create messages in own conversations" 
  on messages for insert 
  with check (conversation_id in (select id from conversations where user_id = auth.uid()));

create policy "Users can delete messages in own conversations" 
  on messages for delete 
  using (conversation_id in (select id from conversations where user_id = auth.uid()));

-- RLS Policies for documents
create policy "Users can view own documents" 
  on documents for select 
  using (auth.uid() = user_id);

create policy "Users can create own documents" 
  on documents for insert 
  with check (auth.uid() = user_id);

create policy "Users can delete own documents" 
  on documents for delete 
  using (auth.uid() = user_id);

-- RLS Policies for document_chunks
create policy "Users can view chunks of own documents" 
  on document_chunks for select 
  using (document_id in (select id from documents where user_id = auth.uid()));

create policy "Users can create chunks for own documents" 
  on document_chunks for insert 
  with check (document_id in (select id from documents where user_id = auth.uid()));

create policy "Users can delete chunks of own documents" 
  on document_chunks for delete 
  using (document_id in (select id from documents where user_id = auth.uid()));

-- Function to automatically create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for auto-creating profile (drop first if exists)
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- Function for vector similarity search
create or replace function match_documents(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  filter_document_ids uuid[] default null
)
returns table (
  id uuid,
  document_id uuid,
  content text,
  chunk_index int,
  start_char int,
  end_char int,
  similarity float
)
language sql stable
as $$
  select
    dc.id,
    dc.document_id,
    dc.content,
    dc.chunk_index,
    dc.start_char,
    dc.end_char,
    1 - (dc.embedding <=> query_embedding) as similarity
  from document_chunks dc
  join documents d on dc.document_id = d.id
  where 
    d.user_id = auth.uid()
    and (filter_document_ids is null or dc.document_id = any(filter_document_ids))
    and 1 - (dc.embedding <=> query_embedding) > match_threshold
  order by dc.embedding <=> query_embedding
  limit match_count;
$$;
