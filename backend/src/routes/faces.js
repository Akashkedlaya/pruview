const express = require('express')
const prisma  = require('../lib/prisma')
const { getS3Url } = require('../lib/s3')
const { getFaceRecognitionProvider } = require('../lib/faceRecognition')

const router = express.Router()

const DEFAULT_MATCH_THRESHOLD = 0.45 // placeholder — see FACE_MATCH_THRESHOLD below
const MAX_CANDIDATES = 50

function getMatchThreshold() {
  const configured = parseFloat(process.env.FACE_MATCH_THRESHOLD)
  return Number.isFinite(configured) ? configured : DEFAULT_MATCH_THRESHOLD
}

// POST /api/g/:token/match-face
// Guest submits a raw selfie frame (base64), never a precomputed
// embedding — the embedding is generated here, server-side, using the
// exact same model/version as the gallery's own embeddings, so the two
// are always comparable. The share token is the only thing that
// determines search scope; nothing in the request body can widen it.
router.post('/:token/match-face', async (req, res) => {
  const startedAt = Date.now()
  try {
    const { image } = req.body
    if (!image || typeof image !== 'string') {
      return res.status(400).json({ message: 'A selfie image is required.' })
    }

    const folder = await prisma.folder.findUnique({
      where:   { shareToken: req.params.token },
      include: { children: { select: { id: true } } }
    })
    if (!folder || !folder.isActive) {
      return res.status(404).json({ message: 'Gallery not found.' })
    }
    // Guest-supplied folder/subfolder ids are never trusted for scope —
    // only what the token itself resolves to.
    const folderIds = [folder.id, ...folder.children.map(c => c.id)]

    const provider = getFaceRecognitionProvider()
    const imageBuffer = Buffer.from(image.replace(/^data:image\/\w+;base64,/, ''), 'base64')

    const faces = await provider.detectFaces(imageBuffer)
    if (faces.length === 0) {
      return res.status(400).json({ message: 'No face detected. Please try again in better lighting.' })
    }
    // A selfie should have exactly one subject — use the most confident
    // detection if the camera happened to catch more than one face.
    const primaryFace = faces.reduce((best, f) => f.confidence > best.confidence ? f : best, faces[0])

    const aligned = await provider.alignFace(imageBuffer, primaryFace)
    const { vector } = await provider.generateEmbedding(aligned)
    if (vector.length !== provider.getEmbeddingDimension()) {
      console.error(`[face-match] embedding dimension mismatch: got ${vector.length}, expected ${provider.getEmbeddingDimension()}`)
      return res.status(500).json({ message: 'Face matching failed.' })
    }

    const vectorLiteral = `[${vector.join(',')}]`
    const modelName = provider.getModelName()
    const modelVersion = provider.getModelVersion()

    const matches = await prisma.$queryRawUnsafe(`
      SELECT
        fe."imageId",
        1 - (fe.embedding <=> '${vectorLiteral}'::vector) as similarity
      FROM "FaceEmbedding" fe
      WHERE fe."folderId" IN (${folderIds.join(',')})
        AND fe."modelName" = '${modelName}'
        AND fe."modelVersion" = '${modelVersion}'
      ORDER BY similarity DESC
      LIMIT ${MAX_CANDIDATES}
    `)

    const threshold = getMatchThreshold()
    const filtered = matches.filter(m => parseFloat(m.similarity) >= threshold)

    // A photo with several matching faces (or the same face detected
    // twice) should only ever be returned once.
    const bestSimilarityByImage = new Map()
    for (const m of filtered) {
      const existing = bestSimilarityByImage.get(m.imageId)
      if (!existing || m.similarity > existing) bestSimilarityByImage.set(m.imageId, m.similarity)
    }
    const imageIds = [...bestSimilarityByImage.keys()]

    console.log(`[face-match] token=${req.params.token} candidates=${matches.length} matched=${imageIds.length} threshold=${threshold} durationMs=${Date.now() - startedAt}`)

    if (imageIds.length === 0) {
      return res.json({ images: [], total: 0 })
    }

    const images = await prisma.image.findMany({ where: { id: { in: imageIds } } })
    const imagesWithUrls = images.map(img => ({
      id:         img.id,
      filename:   img.filename,
      thumbUrl:   getS3Url(img.thumbKey),
      sizeBytes:  img.sizeBytes,
      similarity: bestSimilarityByImage.get(img.id),
    }))

    return res.json({ images: imagesWithUrls, total: imagesWithUrls.length })

  } catch (err) {
    console.error('Face match error:', err.message)
    return res.status(500).json({ message: 'Face matching failed.' })
  }
})

module.exports = router
