-- Fixed match_documents function that accepts user_id as parameter
-- This ensures the auth context is passed from the server

drop function if exists match_documents(vector(1536), float, int, uuid[]);

create or replace function match_documents(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  filter_document_ids uuid[] default null,
  p_user_id uuid default null
)
returns table (
  id uuid,
  document_id uuid,
  content text,
  chunk_index int,
  start_char int,
  end_char int,
  similarity float,
  document_name text
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
    1 - (dc.embedding <=> query_embedding) as similarity,
    d.name as document_name
  from document_chunks dc
  join documents d on dc.document_id = d.id
  where 
    -- Use p_user_id if provided, otherwise fall back to auth.uid()
    d.user_id = coalesce(p_user_id, auth.uid())
    and (filter_document_ids is null or dc.document_id = any(filter_document_ids))
    and 1 - (dc.embedding <=> query_embedding) > match_threshold
  order by dc.embedding <=> query_embedding
  limit match_count;
$$;
