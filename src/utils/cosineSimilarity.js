exports.cosineSimilarity = (vecA, vecB) => {
  const terms = new Set([...Object.keys(vecA), ...Object.keys(vecB)]);

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (const term of terms) {
    const a = vecA[term] || 0;
    const b = vecB[term] || 0;

    dot += a * b;
    normA += a * a;
    normB += b * b;
  }

  if (normA === 0 || normB === 0) return 0;

  return dot / (Math.sqrt(normA) * Math.sqrt(normB));

  /* Cosine Similarity Versi #1 */
  // let dot = 0;
  // let normA = 0;
  // let normB = 0;

  // for (const term in vecA) {
  //   if (vecB[term]) {
  //     dot += vecA[term] * vecB[term];
  //   }
  //   normA += vecA[term] ** 2;
  // }

  // for (const term in vecB) {
  //   normB += vecB[term] ** 2;
  // }

  // if (normA === 0 || normB === 0) return 0;

  // return dot / (Math.sqrt(normA) * Math.sqrt(normB));
};
