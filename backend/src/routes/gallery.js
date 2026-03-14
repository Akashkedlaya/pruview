const express = require('express')
const prisma  = require('../lib/prisma')
const { getS3Url, getPresignedDownloadUrl } = require('../lib/s3')

const router = express.Router()

// GET /api/g/:token — public gallery view
router.get('/:token', async (req, res) => {
  try {
    const folder = await prisma.folder.findUnique({
      where:   { shareToken: req.params.token },
      include: { images: { orderBy: { uploadedAt: 'asc' } } }
    })

    if (!folder)       return res.status(404).json({ message: 'Gallery not found.' })
    if (!folder.isActive) return res.status(403).json({ message: 'This link has been deactivated.' })

    const images = folder.images.map(img => ({
      id:         img.id,
      filename:   img.filename,
      thumbUrl:   getS3Url(img.thumbKey),
      sizeBytes:  img.sizeBytes,
      uploadedAt: img.uploadedAt,
    }))

    return res.json({
      folder: { id: folder.id, name: folder.name, createdAt: folder.createdAt },
      images,
      total: images.length,
    })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Could not load gallery.' })
  }
})

// GET /api/g/:token/download/:imageId — get download URL
router.get('/:token/download/:imageId', async (req, res) => {
  try {
    const folder = await prisma.folder.findUnique({
      where: { shareToken: req.params.token }
    })
    if (!folder || !folder.isActive) {
      return res.status(404).json({ message: 'Gallery not found.' })
    }

    const image = await prisma.image.findFirst({
      where: { id: parseInt(req.params.imageId), folderId: folder.id }
    })
    if (!image) return res.status(404).json({ message: 'Image not found.' })

    const downloadUrl = await getPresignedDownloadUrl(
      image.originalKey,
      image.filename,
      900  // 15 minutes
    )

    return res.json({ downloadUrl, filename: image.filename })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Could not generate download link.' })
  }
})

module.exports = router