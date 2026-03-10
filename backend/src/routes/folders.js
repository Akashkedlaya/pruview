const express        = require('express')
const { v4: uuidv4 } = require('uuid')
const path           = require('path')
const prisma         = require('../lib/prisma')
const requireAuth    = require('../middleware/auth')
const { getPresignedUploadUrl, getS3Url, deleteObject } = require('../lib/s3')

const router = express.Router()
router.use(requireAuth)

// GET /api/folders — list all folders
router.get('/', async (req, res) => {
  try {
    const folders = await prisma.folder.findMany({
      where:   { adminId: req.adminId },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { images: true } } }
    })
    return res.json(folders)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Could not load folders.' })
  }
})

// GET /api/folders/:id — get single folder with images
router.get('/:id', async (req, res) => {
  try {
    const folderId = parseInt(req.params.id)
    const folder = await prisma.folder.findFirst({
      where:   { id: folderId, adminId: req.adminId },
      include: { images: { orderBy: { uploadedAt: 'desc' } } }
    })
    if (!folder) return res.status(404).json({ message: 'Folder not found.' })

    const imagesWithUrls = folder.images.map(img => ({
      ...img,
      thumbUrl: getS3Url(img.thumbKey),
      originalUrl: getS3Url(img.originalKey),
    }))

    return res.json({ ...folder, images: imagesWithUrls })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Could not load folder.' })
  }
})

// POST /api/folders — create folder
router.post('/', async (req, res) => {
  try {
    const { name } = req.body
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Folder name is required.' })
    }
    const folder = await prisma.folder.create({
      data: { name: name.trim(), shareToken: uuidv4(), adminId: req.adminId }
    })
    const shareUrl = `${process.env.FRONTEND_URL}/g/${folder.shareToken}`
    return res.status(201).json({ ...folder, shareUrl })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Could not create folder.' })
  }
})

// DELETE /api/folders/:id — delete folder
router.delete('/:id', async (req, res) => {
  try {
    const folderId = parseInt(req.params.id)
    const folder = await prisma.folder.findFirst({
      where:   { id: folderId, adminId: req.adminId },
      include: { images: true }
    })
    if (!folder) return res.status(404).json({ message: 'Folder not found.' })

    // Delete all S3 files
    for (const img of folder.images) {
      await deleteObject(img.originalKey).catch(() => {})
      await deleteObject(img.thumbKey).catch(() => {})
    }

    await prisma.folder.delete({ where: { id: folderId } })
    return res.json({ message: 'Folder deleted.' })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Could not delete folder.' })
  }
})

// GET /api/folders/:id/upload-url — get presigned S3 upload URL
router.get('/:id/upload-url', async (req, res) => {
  try {
    const folderId = parseInt(req.params.id)
    const { filename, contentType } = req.query

    if (!filename || !contentType) {
      return res.status(400).json({ message: 'filename and contentType required.' })
    }

    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic']
    if (!allowed.includes(contentType.toLowerCase())) {
      return res.status(400).json({ message: 'Only image files allowed.' })
    }

    const folder = await prisma.folder.findFirst({
      where: { id: folderId, adminId: req.adminId }
    })
    if (!folder) return res.status(404).json({ message: 'Folder not found.' })

    const ext      = path.extname(filename)
    const baseName = `${uuidv4()}${ext}`
    const s3Key    = `originals/${baseName}`

    const uploadUrl = await getPresignedUploadUrl(s3Key, contentType, 300)
    return res.json({ uploadUrl, s3Key })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Could not generate upload URL.' })
  }
})

// POST /api/folders/:id/images — save image metadata after S3 upload
router.post('/:id/images', async (req, res) => {
  try {
    const folderId = parseInt(req.params.id)
    const { filename, originalKey, sizeBytes } = req.body

    if (!filename || !originalKey || !sizeBytes) {
      return res.status(400).json({ message: 'filename, originalKey, sizeBytes required.' })
    }

    const folder = await prisma.folder.findFirst({
      where: { id: folderId, adminId: req.adminId }
    })
    if (!folder) return res.status(404).json({ message: 'Folder not found.' })

    // For now thumbKey = same as originalKey (no Lambda yet)
    const thumbKey = originalKey

    const image = await prisma.image.create({
      data: { filename, originalKey, thumbKey, sizeBytes: parseInt(sizeBytes), folderId }
    })

    return res.status(201).json({
      ...image,
      thumbUrl:    getS3Url(thumbKey),
      originalUrl: getS3Url(originalKey),
    })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Could not save image.' })
  }
})

module.exports = router