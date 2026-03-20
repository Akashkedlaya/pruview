const express     = require('express')
const prisma      = require('../lib/prisma')
const requireAuth = require('../middleware/auth')

const router = express.Router()
router.use(requireAuth)

// POST /api/images/:id/index-faces
// Admin sends embeddings detected from uploaded photo
router.post('/:id/index-faces', async (req, res) => {
  try {
    const imageId   = parseInt(req.params.id)
    const { embeddings, folderId } = req.body

    if (!embeddings || !Array.isArray(embeddings)) {
      return res.status(400).json({ message: 'embeddings array required.' })
    }

    // Verify image belongs to this admin
    const image = await prisma.image.findFirst({
      where: {
        id: imageId,
        folder: { adminId: req.adminId }
      }
    })

    if (!image) {
      return res.status(404).json({ message: 'Image not found.' })
    }

    // Delete existing embeddings for this image
    await prisma.$executeRawUnsafe(
      `DELETE FROM "FaceEmbedding" WHERE "imageId" = ${imageId}`
    )

    // Insert new embeddings
    for (const embedding of embeddings) {
      const vectorStr = `[${embedding.join(',')}]`
      await prisma.$executeRawUnsafe(`
        INSERT INTO "FaceEmbedding" ("imageId", "folderId", embedding, "createdAt")
        VALUES (${imageId}, ${image.folderId}, '${vectorStr}'::vector, NOW())
      `)
    }

    return res.json({
      message:  'Faces indexed successfully.',
      faces:    embeddings.length,
      imageId
    })

  } catch (err) {
    console.error('Face index error:', err)
    return res.status(500).json({ message: 'Face indexing failed.' })
  }
})

module.exports = router