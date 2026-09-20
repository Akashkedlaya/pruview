// FaceRecognitionProvider abstraction.
//
// Every concrete provider (stub, ONNX-based production model, a future v2,
// a cloud API, ...) implements this exact shape:
//
//   detectFaces(imageBuffer)      -> Promise<Array<{ box, landmarks, confidence }>>
//   alignFace(imageBuffer, face)  -> Promise<Buffer>            (cropped/normalized face image)
//   generateEmbedding(alignedFace)-> Promise<{ vector: number[], qualityScore?: number }>
//   getModelName()                -> string
//   getModelVersion()             -> string
//   getEmbeddingDimension()       -> number
//
// Nothing outside this directory should know which concrete provider is
// active, what file format its weights are in, or how detection/alignment
// work internally. The worker and routes only ever call these six methods
// and read getModelName()/getModelVersion()/getEmbeddingDimension() to tag
// and validate embeddings — swapping providers (e.g. v1 -> v2) never
// touches gallery, database, or search code, only this factory.

let cachedProvider = null

function loadProvider() {
  const name = process.env.FACE_MODEL_PROVIDER || 'stub'

  if (name === 'stub') {
    const StubFaceModel = require('./stubProvider')
    return new StubFaceModel()
  }

  if (name === 'production-v1') {
    const ProductionFaceModelV1 = require('./productionV1')
    return new ProductionFaceModelV1()
  }

  throw new Error(`Unknown FACE_MODEL_PROVIDER "${name}". Expected "stub" or "production-v1".`)
}

function getFaceRecognitionProvider() {
  if (!cachedProvider) cachedProvider = loadProvider()
  return cachedProvider
}

module.exports = { getFaceRecognitionProvider }
