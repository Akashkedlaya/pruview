const prisma = require('./prisma')
const { getObjectBuffer } = require('./s3')
const { getFaceRecognitionProvider } = require('./faceRecognition')

const BATCH_SIZE = 5

// Queues an image for (re)processing. Safe to call on an image that
// already has a pending/failed job — a fresh job row is created and the
// image's prior embeddings stay in place until the new job actually
// completes, so a failed retry never leaves the image with zero
// embeddings if it previously had good ones.
async function enqueueImageForProcessing(imageId) {
  await prisma.processingJob.create({ data: { imageId, status: 'PENDING' } })
}

async function processNextBatch() {
  const jobs = await prisma.processingJob.findMany({
    where:   { status: 'PENDING' },
    orderBy: { createdAt: 'asc' },
    take:    BATCH_SIZE,
    include: { image: true }
  })

  for (const job of jobs) {
    await processJob(job)
  }

  return jobs.length
}

async function processJob(job) {
  const provider = getFaceRecognitionProvider()
  const startedAt = new Date()

  await prisma.processingJob.update({
    where: { id: job.id },
    data:  { status: 'RUNNING', startedAt, attempts: { increment: 1 } }
  })
  await prisma.image.update({
    where: { id: job.imageId },
    data:  { status: 'PROCESSING', processingStartedAt: startedAt, processingError: null }
  })

  console.log(`[face-processing] started image=${job.imageId} model=${provider.getModelName()}/${provider.getModelVersion()}`)

  try {
    const imageBuffer = await getObjectBuffer(job.image.originalKey)
    const faces = await provider.detectFaces(imageBuffer)

    const embeddings = []
    for (let i = 0; i < faces.length; i++) {
      const aligned = await provider.alignFace(imageBuffer, faces[i])
      const { vector, qualityScore } = await provider.generateEmbedding(aligned)
      if (vector.length !== provider.getEmbeddingDimension()) {
        throw new Error(`Embedding dimension mismatch: got ${vector.length}, expected ${provider.getEmbeddingDimension()}`)
      }
      embeddings.push({ vector, faceIndex: i, qualityScore })
    }

    // Replace any previous embeddings for this image atomically alongside
    // the new ones, so a crash mid-write can't leave a partial mix of
    // old + new model embeddings for the same image.
    await prisma.$transaction(async (tx) => {
      await tx.faceEmbedding.deleteMany({ where: { imageId: job.imageId } })
      for (const emb of embeddings) {
        const vectorLiteral = `[${emb.vector.join(',')}]`
        await tx.$executeRawUnsafe(`
          INSERT INTO "FaceEmbedding"
            ("imageId", "folderId", embedding, "modelName", "modelVersion", "embeddingDimension", "faceIndex", "qualityScore", "createdAt", "updatedAt")
          VALUES
            (${job.imageId}, ${job.image.folderId}, '${vectorLiteral}'::vector, '${provider.getModelName()}', '${provider.getModelVersion()}', ${provider.getEmbeddingDimension()}, ${emb.faceIndex}, ${emb.qualityScore ?? 'NULL'}, NOW(), NOW())
        `)
      }
    })

    const completedAt = new Date()
    await prisma.image.update({
      where: { id: job.imageId },
      data:  { status: 'PROCESSED', faceCount: embeddings.length, processingCompletedAt: completedAt, processingError: null }
    })
    await prisma.processingJob.update({
      where: { id: job.id },
      data:  { status: 'DONE', finishedAt: completedAt }
    })

    console.log(`[face-processing] completed image=${job.imageId} faces=${embeddings.length} durationMs=${completedAt - startedAt}`)
  } catch (err) {
    console.error(`[face-processing] failed image=${job.imageId}:`, err.message)
    await prisma.image.update({
      where: { id: job.imageId },
      data:  { status: 'FAILED', processingError: err.message, processingCompletedAt: new Date() }
    })
    await prisma.processingJob.update({
      where: { id: job.id },
      data:  { status: 'FAILED', error: err.message, finishedAt: new Date() }
    })
  }
}

module.exports = { enqueueImageForProcessing, processNextBatch }
