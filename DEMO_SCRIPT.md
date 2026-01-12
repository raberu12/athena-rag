# Athena RAG Chatbot - Demo Script

## Introduction (30 seconds)

"Welcome to Athena, a document-aware chatbot that uses Retrieval-Augmented Generation, or RAG, to answer questions based on your uploaded documents. Unlike traditional chatbots that rely solely on pre-trained knowledge, Athena dynamically retrieves relevant information from your own documents and cites its sources—similar to how Wikipedia articles reference their sources."

---

## Part 1: Document Upload (2 minutes)

*[Click the document icon in the header to open the document drawer]*

"Let's start by uploading a document. I'll use this PDF as our example."

*[Drag and drop or select a PDF file]*

"When I upload this document, several things happen under the hood:

### 1. Parsing
First, we **parse** the document to extract raw text. For PDFs, we use a library called `pdf-parse` that reads the binary PDF format and extracts the text content, along with metadata like page count. Plain text, Markdown, and JSON files are read directly.

### 2. Chunking
Next, the extracted text goes through **chunking**. We split the text into smaller, overlapping segments of about 500 characters each, with a 100-character overlap between chunks. Why overlap? Because important context might span across chunk boundaries. If a sentence starts at the end of one chunk and continues into another, the overlap ensures we don't lose that context.

### 3. Embedding Generation
Here's where it gets interesting. Each chunk is converted into an **embedding**—a vector of 1,536 numbers that represents the semantic meaning of that text. We use OpenAI's `text-embedding-3-small` model for this. 

Think of embeddings like coordinates in a high-dimensional space. Text with similar meanings ends up close together in this space. The phrase 'the cat sat on the mat' would be closer to 'a feline rested on a rug' than to 'stock market trends.'

### 4. Vector Storage & Indexing
Finally, these embeddings are stored in our PostgreSQL database using the **pgvector** extension. This creates what's called a **vector index**—a specialized data structure that allows us to quickly find similar vectors. When you ask a question later, we convert your question to an embedding and search for the closest document chunks. This similarity search uses **cosine similarity**, which measures the angle between two vectors rather than the distance."

*[Show the document appearing in the list with chunk count]*

"Done! You can see the document is now processed and ready. Behind the scenes, it's been chunked into X pieces and indexed in our vector store."

---

## Part 2: Asking Questions (2 minutes)

*[Select the conversation or create a new one]*

"Now let's ask a question about our document."

*[Type a question related to the document content]*

"When I submit this query, here's the RAG pipeline in action:

### 1. Query Embedding
First, my question gets converted into an embedding using the same model—so it lives in the same vector space as our document chunks.

### 2. Vector Search (Retrieval)
Then we perform a **similarity search** against our vector database. We retrieve the top 8 most similar chunks—the ones whose embeddings are closest to my query. This is the 'Retrieval' in Retrieval-Augmented Generation.

### 3. Context Assembly
These retrieved chunks become the **context** for our language model. We format them with citation identifiers—c1, c2, c3, and so on.

### 4. LLM Generation
Now we send everything to our LLM—Google's Gemini 2.0 Flash through OpenRouter. The prompt instructs the model to answer based only on the provided context and to cite sources using special markers like `{{cite:c1}}`.

### 5. Response Parsing
When the response comes back, we parse out those citation markers and convert them into interactive footnotes."

*[Point to the citation markers in the response]*

"See these bracketed numbers? Each one links back to a specific chunk from the original document. Hover over one..."

*[Hover to show tooltip]*

"You get a preview. Click it..."

*[Click to show modal]*

"And you see the full source text with the document name. This transparency is crucial—you can verify exactly where the AI got its information."

---

## Part 3: Technical Architecture (1 minute)

"Let me quickly walk through the architecture:

- **Frontend**: Next.js 16 with React 19, using Tailwind CSS and shadcn/ui components
- **Database**: Supabase PostgreSQL with the pgvector extension for vector operations
- **LLM**: OpenRouter for both embeddings and chat completion (Gemini 2.0 Flash)
- **Security**: Row-Level Security ensures each user only accesses their own documents

The beauty of RAG is that the LLM doesn't need to be fine-tuned on your data. It receives relevant context at query time, which means your data stays private in your database and the model always works with up-to-date information."

---

## Closing (30 seconds)

"That's Athena—a production-ready RAG application with document parsing, vector embeddings, semantic search, and transparent citations. The entire flow from upload to answer takes seconds, and you always know exactly where the information is coming from.

Any questions?"

---

## Key Technical Terms Reference

| Term | Definition |
|------|------------|
| **RAG** | Retrieval-Augmented Generation - enhancing LLM responses with retrieved context |
| **Embedding** | A vector representation of text that captures semantic meaning |
| **Vector Store** | A database optimized for storing and searching embeddings |
| **Chunking** | Splitting documents into smaller, manageable pieces |
| **Cosine Similarity** | A measure of similarity between two vectors based on the angle between them |
| **pgvector** | PostgreSQL extension for vector similarity search |
