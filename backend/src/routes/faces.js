const express = require('express')
const prisma  = require('../lib/prisma')
const { getS3Url } = require('../lib/s3')

const router = express.Router()

router.post('/:token/match-face', async (req, res) => {
  try {
    const { embedding } = req.body

    if (!embedding || !Array.isArray(embedding) || embedding.length !== 128) {
      return res.status(400).json({ message: 'Valid 128-dimension embedding required.' })
    }

    const folder = await prisma.folder.findUnique({
      where: { shareToken: req.params.token }
    })

    if (!folder || !folder.isActive) {
      return res.status(404).json({ message: 'Gallery not found.' })
    }

    const vectorStr = `[${embedding.join(',')}]`

    const matches = await prisma.$queryRawUnsafe(`
      SELECT 
        fe.id as embedding_id,
        fe."imageId",
        fe."folderId",
        1 - (fe.embedding <=> '${vectorStr}'::vector) as similarity
      FROM "FaceEmbedding" fe
      WHERE fe."folderId" = ${folder.id}
      ORDER BY similarity DESC
      LIMIT 50
    `)

    console.log('=== FACE MATCH DEBUG ===')
    console.log('All scores:', matches.map(m => ({
      imageId: m.imageId,
      similarity: parseFloat(m.similarity).toFixed(3)
    })))

    const filtered = matches.filter(m => parseFloat(m.similarity) >= 0.75)
    console.log('Above 0.75 threshold:', filtered.length)
    console.log('========================')

    if (filtered.length === 0) {
      return res.json({ images: [], total: 0 })
    }

    const imageIds = [...new Set(filtered.map(m => m.imageId))]

    const images = await prisma.image.findMany({
      where: { id: { in: imageIds } }
    })

    const imagesWithUrls = images.map(img => ({
      id:        img.id,
      filename:  img.filename,
      thumbUrl:  getS3Url(img.thumbKey),
      sizeBytes: img.sizeBytes,
      similarity: filtered.find(m => m.imageId === img.id)?.similarity
    }))

    return res.json({ images: imagesWithUrls, total: imagesWithUrls.length })

  } catch (err) {
    console.error('Face match error:', err)
    return res.status(500).json({ message: 'Face matching failed.' })
  }
})

module.exports = router
