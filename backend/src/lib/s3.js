const { S3Client, DeleteObjectCommand } = require('@aws-sdk/client-s3')
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner')
const { PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3')
const path = require('path')

async function streamToBuffer(stream) {
  const chunks = []
  for await (const chunk of stream) chunks.push(chunk)
  return Buffer.concat(chunks)
}

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId:     process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
})

const BUCKET = process.env.AWS_S3_BUCKET

async function getPresignedUploadUrl(key, contentType, expiresIn = 300) {
  const command = new PutObjectCommand({
    Bucket:      BUCKET,
    Key:         key,
    ContentType: contentType,
  })
  return await getSignedUrl(s3, command, { expiresIn })
}

async function getPresignedDownloadUrl(key, filename, expiresIn = 900) {
  const command = new GetObjectCommand({
    Bucket:                     BUCKET,
    Key:                        key,
    ResponseContentDisposition: `attachment; filename="${encodeURIComponent(filename)}"`,
  })
  return await getSignedUrl(s3, command, { expiresIn })
}

async function deleteObject(key) {
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }))
}

// Downloads an object's bytes directly (used by the face-processing
// worker to read the uploaded photo — this is server-side only, never
// exposed to a client).
async function getObjectBuffer(key) {
  const response = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }))
  return streamToBuffer(response.Body)
}

function getS3Url(key) {
  return `https://${BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`
}

module.exports = { getPresignedUploadUrl, getPresignedDownloadUrl, deleteObject, getS3Url, getObjectBuffer }