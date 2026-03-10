const express     = require('express')
const prisma      = require('../lib/prisma')
const requireAuth = require('../middleware/auth')
const { deleteObject } = require('../lib/s3')

const router = express.Router()
router.use(requireAuth)

// DELETE /api/images/:id
router.delete('/:id', async (req, res) => {
  try {
    const imageId = parseInt(req.params.id)
    const image = await prisma.image.findFirst({
      where:   { id: imageId },
      include: { folder: { select: { adminId: true } } }
    })
    if (!image) return res.status(404).json({ message: 'Image not found.' })
    if (image.folder.adminId !== req.adminId) {
      return res.status(403).json({ message: 'Not allowed.' })
    }

    await Promise.all([
      deleteObject(image.originalKey).catch(() => {}),
      deleteObject(image.thumbKey).catch(() => {})
    ])

    await prisma.image.delete({ where: { id: imageId } })
    return res.json({ message: 'Image deleted.' })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Could not delete image.' })
  }
})

module.exports = router