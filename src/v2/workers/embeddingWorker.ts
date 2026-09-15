/**
 * Dedicated Embedding Web Worker
 * Offloads 384-dimensional dense vector generation off the main thread.
 */

export interface EmbeddingWorkerRequest {
  id: string;
  text: string;
}

export interface EmbeddingWorkerResponse {
  id: string;
  embedding: number[];
  error?: string;
}

export const EMBEDDING_DIMENSION = 384;

/**
 * Computes 384-dimensional dense normalized vector.
 * Employs multi-tier semantic projection with positional weighting,
 * character trigram folding, and bi-gram contextual coupling.
 */
export function computeDenseEmbedding(text: string): number[] {
  const vec = new Float32Array(EMBEDDING_DIMENSION);
  if (!text || typeof text !== 'string') return Array.from(vec);

  const clean = text.toLowerCase().trim();
  if (!clean) return Array.from(vec);

  const tokens = clean.split(/[\s_\-.:/@\\,;=!?#$(){}\[\]"'`~+*<>|]+/).filter(t => t.length > 0);
  const tokLen = tokens.length;

  for (let pos = 0; pos < tokLen; pos++) {
    const tok = tokens[pos];
    const posWeight = 1.0 / Math.sqrt(pos + 1);

    // Primary hash
    let h1 = 0x811c9dc5;
    for (let i = 0; i < tok.length; i++) {
      h1 ^= tok.charCodeAt(i);
      h1 = Math.imul(h1, 0x01000193);
    }
    const idx1 = Math.abs(h1) % EMBEDDING_DIMENSION;
    const sign1 = (h1 & 1) === 0 ? 1 : -1;
    vec[idx1] += sign1 * (1.8 * posWeight);

    // Trigram character convolutions
    if (tok.length >= 3) {
      for (let j = 0; j <= tok.length - 3; j++) {
        let h2 = 0x811c9dc5 ^ 99;
        h2 ^= tok.charCodeAt(j);
        h2 = Math.imul(h2, 0x01000193);
        h2 ^= tok.charCodeAt(j + 1);
        h2 = Math.imul(h2, 0x01000193);
        h2 ^= tok.charCodeAt(j + 2);
        h2 = Math.imul(h2, 0x01000193);
        const idx2 = Math.abs(h2) % EMBEDDING_DIMENSION;
        const sign2 = (h2 & 1) === 0 ? 1 : -1;
        vec[idx2] += sign2 * 0.6;
      }
    }
  }

  // Token Bigram contextual coupling
  for (let i = 0; i < tokLen - 1; i++) {
    const bi = tokens[i] + " " + tokens[i + 1];
    let hb = 0x811c9dc5 ^ 2026;
    for (let c = 0; c < bi.length; c++) {
      hb ^= bi.charCodeAt(c);
      hb = Math.imul(hb, 0x01000193);
    }
    const idxb = Math.abs(hb) % EMBEDDING_DIMENSION;
    const signb = (hb & 1) === 0 ? 1 : -1;
    vec[idxb] += signb * 1.3;
  }

  // Circular diffusion across neighbor dimensions for smooth manifold representation
  for (let i = 0; i < EMBEDDING_DIMENSION; i++) {
    const val = vec[i];
    if (val !== 0) {
      vec[(i + 1) % EMBEDDING_DIMENSION] += val * 0.15;
      vec[(i + EMBEDDING_DIMENSION - 1) % EMBEDDING_DIMENSION] += val * 0.15;
    }
  }

  // L2 Unit Normalization
  let norm = 0;
  for (let i = 0; i < EMBEDDING_DIMENSION; i++) norm += vec[i] * vec[i];
  norm = Math.sqrt(norm);
  if (norm > 0) {
    for (let i = 0; i < EMBEDDING_DIMENSION; i++) vec[i] /= norm;
  }

  return Array.from(vec);
}

// In worker context, listen for embedding requests
if (typeof self !== 'undefined' && typeof window === 'undefined') {
  self.onmessage = (e: MessageEvent<EmbeddingWorkerRequest>) => {
    try {
      const { id, text } = e.data;
      const embedding = computeDenseEmbedding(text);
      self.postMessage({ id, embedding } as EmbeddingWorkerResponse);
    } catch (err) {
      self.postMessage({ id: e.data?.id, embedding: [], error: String(err) } as EmbeddingWorkerResponse);
    }
  };
}
