const crypto = require('crypto')

// Development/testing provider — NOT a real face recognizer. Lets the
// whole pipeline (job queue, worker, routes, guest search, dedup, threshold
// logic) run and be verified end-to-end without any licensed model weights
// present. Embeddings are deterministic per input buffer (same photo bytes
// -> same fake vector) so duplicate-prevention and "same model for indexing
// and search" checks are still meaningfully testable, but two different
// photos of the same real person will NOT produce similar vectors here.
// Swap FACE_MODEL_PROVIDER=production-v1 for an actual recognizer.
//
// Dimension comes from FACE_EMBEDDING_DIMENSION (same env var productionV1
// reads), not a hardcoded number — the pgvector column is provisioned to
// one fixed width, so whichever provider is active must match it. Do not
// give the stub its own separate dimension "for clarity"; that's exactly
// what causes an "expected N dimensions, not M" insert failure the moment
// it's the active provider.
const DIMENSION = parseInt(process.env.FACE_EMBEDDING_DIMENSION || '512', 10)
const MODEL_NAME = 'stub-face-model'
const MODEL_VERSION = 'dev'

// Expands a SHA-256 digest into `dimension` pseudo-random floats in
// [-1, 1] via a simple counter-based stream — deterministic, no external
// randomness, good enough for exercising the pipeline.
function deterministicVector(seedBuffer, dimension) {
  const vector = new Array(dimension)
  let counter = 0
  let pool = Buffer.alloc(0)
  let poolOffset = 0

  while (counter < dimension) {
    if (poolOffset >= pool.length) {
      pool = crypto.createHash('sha256').update(seedBuffer).update(Buffer.from([counter])).digest()
      poolOffset = 0
    }
    const byte = pool[poolOffset++]
    vector[counter] = (byte / 255) * 2 - 1
    counter++
  }

  // L2-normalize, matching how a real embedding model's output is used.
  const norm = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0)) || 1
  return vector.map(v => v / norm)
}

class StubFaceModel {
  async detectFaces(imageBuffer) {
    // Always reports exactly one face covering the whole image — enough to
    // drive one embedding through the pipeline per upload.
    return [{
      box: { x: 0, y: 0, width: 1, height: 1 }, // relative/normalized
      landmarks: [],
      confidence: 0.99
    }]
  }

  async alignFace(imageBuffer, face) {
    return imageBuffer // no real cropping/alignment — pass through
  }

  async generateEmbedding(alignedFace) {
    const hash = crypto.createHash('sha256').update(alignedFace).digest()
    return {
      vector: deterministicVector(hash, DIMENSION),
      qualityScore: 0.5
    }
  }

  getModelName() { return MODEL_NAME }
  getModelVersion() { return MODEL_VERSION }
  getEmbeddingDimension() { return DIMENSION }
}

module.exports = StubFaceModel
