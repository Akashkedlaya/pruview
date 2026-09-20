const express     = require('express')
const prisma      = require('../lib/prisma')
const requireAuth = require('../middleware/auth')
const { enqueueImageForProcessing } = require('../lib/faceProcessingWorker')

const router = express.Router()
router.use(requireAuth)

// POST /api/images/:id/process-faces
// Queues server-side AI face processing for one image (initial index or a
// manual retry after a FAILED status). Returns immediately — the actual
// detection/embedding work happens in the background worker, never inside
// this request.
router.post('/:id/process-faces', async (req, res) => {
  try {
    const imageId = parseInt(req.params.id)

    const image = await prisma.image.findFirst({
      where: { id: imageId, folder: { adminId: req.adminId } }
    })
    if (!image) return res.status(404).json({ message: 'Image not found.' })

    await prisma.image.update({
      where: { id: imageId },
      data:  { status: 'UPLOADED', processingError: null }
    })
    await enqueueImageForProcessing(imageId)

    return res.status(202).json({ message: 'Face processing queued.', imageId, status: 'UPLOADED' })
  } catch (err) {
    console.error('Face processing enqueue error:', err)
    return res.status(500).json({ message: 'Could not queue face processing.' })
  }
})

module.exports = router
