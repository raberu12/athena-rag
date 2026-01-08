-- Run this to add/update the match_documents function
-- This is safe to run multiple times (creates or replaces)

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
