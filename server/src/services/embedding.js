// Embedding service - stub for vector embeddings
export async function generateEmbedding(text) {
  // Return a dummy embedding vector (384 dimensions)
  const dim = 384;
  const vector = new Array(dim).fill(0).map(() => Math.random() * 2 - 1);
  return vector;
}

export async function generateEmbeddings(texts) {
  const results = [];
  for (const text of texts) {
    const embedding = await generateEmbedding(text);
    results.push({ text, embedding });
  }
  return results;
}

export function vectorToJSON(vector) {
  return JSON.stringify(vector);
}

export function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
