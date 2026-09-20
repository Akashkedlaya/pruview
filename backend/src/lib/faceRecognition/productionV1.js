// Production face-recognition provider: SCRFD (detection) + ArcFace-family
// ResNet embedding model, run server-side via onnxruntime-node.
//
// IMPORTANT — licensing: this provider loads whatever .onnx files are
// present at FACE_DETECTION_MODEL_PATH / FACE_RECOGNITION_MODEL_PATH. This
// code does not bundle or download model weights. Pruview must source and
// verify a commercially-licensed set of weights (e.g. a properly licensed
// build of an InsightFace-architecture model, or an equivalent
// commercially-cleared ArcFace-compatible model) before pointing
// FACE_MODEL_PROVIDER=production-v1 at a real deployment. The detection/
// alignment/embedding logic below follows the standard, publicly
// documented SCRFD + ArcFace reference algorithm (fixed preprocessing
// constants, not a specific vendor's proprietary pipeline), so it's
// written to work with any weights trained to that same input/output
// contract.
//
// NOTE: this file has not been exercised against real model weights in
// this environment (none are present) — the numerical pre/post-processing
// follows the published reference algorithm, but should be validated
// end-to-end with real weights and real photos before relying on it.

const sharp = require('sharp')
const path = require('path')

const MODEL_NAME    = process.env.FACE_MODEL_NAME    || 'production-face-model'
const MODEL_VERSION = process.env.FACE_MODEL_VERSION || 'v1'
const EMBEDDING_DIMENSION = parseInt(process.env.FACE_EMBEDDING_DIMENSION || '512', 10)
const DETECTION_THRESHOLD = parseFloat(process.env.FACE_DETECTION_THRESHOLD || '0.5')

const DETECTOR_INPUT_SIZE = 640      // SCRFD 10G default
const STRIDES = [8, 16, 32]
const ANCHORS_PER_LOCATION = 2
const ALIGNED_FACE_SIZE = 112        // standard ArcFace input crop size

// Standard ArcFace 112x112 reference landmark template (left eye, right
// eye, nose tip, left mouth corner, right mouth corner) — the same
// constants used across the InsightFace ecosystem for face alignment.
const ARCFACE_REFERENCE_LANDMARKS = [
  [38.2946, 51.6963],
  [73.5318, 51.5014],
  [56.0252, 71.7366],
  [41.5493, 92.3655],
  [70.7299, 92.2041],
]

class ProductionFaceModelV1 {
  constructor() {
    this._detectorSession = null
    this._recognizerSession = null
  }

  async _ensureSessions() {
    if (this._detectorSession && this._recognizerSession) return
    const ort = require('onnxruntime-node')

    const detectorPath = process.env.FACE_DETECTION_MODEL_PATH
    const recognizerPath = process.env.FACE_RECOGNITION_MODEL_PATH
    if (!detectorPath || !recognizerPath) {
      throw new Error(
        'FACE_DETECTION_MODEL_PATH and FACE_RECOGNITION_MODEL_PATH must be set when ' +
        'FACE_MODEL_PROVIDER=production-v1. Point them at licensed ONNX model files.'
      )
    }

    this._detectorSession = await ort.InferenceSession.create(path.resolve(detectorPath))
    this._recognizerSession = await ort.InferenceSession.create(path.resolve(recognizerPath))
  }

  // ── Detection ──────────────────────────────────────────────────────

  async detectFaces(imageBuffer) {
    await this._ensureSessions()
    const ort = require('onnxruntime-node')

    const meta = await sharp(imageBuffer).metadata()
    const { width: origWidth, height: origHeight } = meta
    const scale = DETECTOR_INPUT_SIZE / Math.max(origWidth, origHeight)

    // Letterbox-resize onto a square canvas, preserving aspect ratio, so
    // the fixed-stride anchor grid lines up the same way regardless of
    // the source photo's dimensions.
    const resizedWidth = Math.round(origWidth * scale)
    const resizedHeight = Math.round(origHeight * scale)
    const { data: pixels } = await sharp(imageBuffer)
      .resize(resizedWidth, resizedHeight, { fit: 'fill' })
      .extend({
        top: 0, left: 0,
        bottom: DETECTOR_INPUT_SIZE - resizedHeight,
        right: DETECTOR_INPUT_SIZE - resizedWidth,
        background: { r: 0, g: 0, b: 0 }
      })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true })

    const inputTensor = new ort.Tensor('float32', rgbToCHW(pixels, DETECTOR_INPUT_SIZE, DETECTOR_INPUT_SIZE), [1, 3, DETECTOR_INPUT_SIZE, DETECTOR_INPUT_SIZE])
    const inputName = this._detectorSession.inputNames[0]
    const outputs = await this._detectorSession.run({ [inputName]: inputTensor })

    const faces = decodeScrfdOutputs(outputs, this._detectorSession.outputNames, DETECTION_THRESHOLD)
      .map(face => scaleFaceToOriginal(face, scale))
      .filter(face => withinBounds(face.box, origWidth, origHeight))

    return nonMaxSuppression(faces, 0.4)
  }

  // ── Alignment ──────────────────────────────────────────────────────

  async alignFace(imageBuffer, face) {
    if (!face.landmarks || face.landmarks.length !== 5) {
      // No landmarks available — fall back to a plain center-crop of the
      // detected box, resized to the model's expected input size.
      return sharp(imageBuffer)
        .extract({
          left: Math.max(0, Math.round(face.box.x)),
          top: Math.max(0, Math.round(face.box.y)),
          width: Math.round(face.box.width),
          height: Math.round(face.box.height),
        })
        .resize(ALIGNED_FACE_SIZE, ALIGNED_FACE_SIZE)
        .toBuffer()
    }

    const transform = estimateSimilarityTransform(face.landmarks, ARCFACE_REFERENCE_LANDMARKS)
    return sharp(imageBuffer)
      .affine([transform.a, transform.b, transform.c, transform.d], {
        idx: transform.tx, idy: transform.ty,
        background: { r: 0, g: 0, b: 0 }
      })
      .extract({ left: 0, top: 0, width: ALIGNED_FACE_SIZE, height: ALIGNED_FACE_SIZE })
      .toBuffer()
  }

  // ── Embedding ──────────────────────────────────────────────────────

  async generateEmbedding(alignedFace) {
    await this._ensureSessions()
    const ort = require('onnxruntime-node')

    const { data: pixels } = await sharp(alignedFace)
      .resize(ALIGNED_FACE_SIZE, ALIGNED_FACE_SIZE)
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true })

    // Standard ArcFace normalization: (pixel - 127.5) / 128.0, RGB, NCHW.
    const normalized = new Float32Array(pixels.length)
    for (let i = 0; i < pixels.length; i++) {
      normalized[i] = (pixels[i] - 127.5) / 128.0
    }
    const chw = rgbToCHW({ data: Buffer.from(normalized.buffer), info: {} }, ALIGNED_FACE_SIZE, ALIGNED_FACE_SIZE, true)

    const inputTensor = new ort.Tensor('float32', chw, [1, 3, ALIGNED_FACE_SIZE, ALIGNED_FACE_SIZE])
    const inputName = this._recognizerSession.inputNames[0]
    const outputs = await this._recognizerSession.run({ [inputName]: inputTensor })
    const outputName = this._recognizerSession.outputNames[0]
    const rawVector = Array.from(outputs[outputName].data)

    const norm = Math.sqrt(rawVector.reduce((sum, v) => sum + v * v, 0)) || 1
    return {
      vector: rawVector.map(v => v / norm),
      qualityScore: null
    }
  }

  getModelName() { return MODEL_NAME }
  getModelVersion() { return MODEL_VERSION }
  getEmbeddingDimension() { return EMBEDDING_DIMENSION }
}

// ── Helpers ────────────────────────────────────────────────────────────

// Interleaved HWC pixel buffer -> planar CHW Float32Array (model input layout).
function rgbToCHW({ data }, width, height, alreadyFloat = false) {
  const channelSize = width * height
  const out = new Float32Array(channelSize * 3)
  const src = alreadyFloat ? new Float32Array(data.buffer, data.byteOffset, data.length / 4) : data
  for (let i = 0; i < channelSize; i++) {
    out[i] = src[i * 3]                    // R
    out[channelSize + i] = src[i * 3 + 1]  // G
    out[channelSize * 2 + i] = src[i * 3 + 2] // B
  }
  return out
}

// Standard RetinaFace/SCRFD anchor decode: distance-encoded box/landmark
// offsets from each anchor center, at strides [8, 16, 32], 2 anchors per
// grid location.
function decodeScrfdOutputs(outputs, outputNames, threshold) {
  const faces = []
  for (let strideIdx = 0; strideIdx < STRIDES.length; strideIdx++) {
    const stride = STRIDES[strideIdx]
    const scores = outputs[outputNames[strideIdx]]?.data
    const bboxes = outputs[outputNames[strideIdx + STRIDES.length]]?.data
    const kps = outputs[outputNames[strideIdx + STRIDES.length * 2]]?.data
    if (!scores || !bboxes) continue

    const gridSize = DETECTOR_INPUT_SIZE / stride
    for (let anchor = 0; anchor < ANCHORS_PER_LOCATION; anchor++) {
      for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
          const idx = (y * gridSize + x) * ANCHORS_PER_LOCATION + anchor
          const score = scores[idx]
          if (score < threshold) continue

          const cx = x * stride
          const cy = y * stride
          const bboxOffset = idx * 4
          const box = {
            x: cx - bboxes[bboxOffset] * stride,
            y: cy - bboxes[bboxOffset + 1] * stride,
            width:  (bboxes[bboxOffset + 2] + bboxes[bboxOffset]) * stride,
            height: (bboxes[bboxOffset + 3] + bboxes[bboxOffset + 1]) * stride,
          }

          let landmarks = []
          if (kps) {
            const kpsOffset = idx * 10
            for (let p = 0; p < 5; p++) {
              landmarks.push({
                x: cx + kps[kpsOffset + p * 2] * stride,
                y: cy + kps[kpsOffset + p * 2 + 1] * stride,
              })
            }
          }

          faces.push({ box, landmarks, confidence: score })
        }
      }
    }
  }
  return faces
}

function scaleFaceToOriginal(face, scale) {
  const inv = 1 / scale
  return {
    box: { x: face.box.x * inv, y: face.box.y * inv, width: face.box.width * inv, height: face.box.height * inv },
    landmarks: face.landmarks.map(p => ({ x: p.x * inv, y: p.y * inv })),
    confidence: face.confidence,
  }
}

function withinBounds(box, width, height) {
  return box.x + box.width > 0 && box.y + box.height > 0 && box.x < width && box.y < height
}

function nonMaxSuppression(faces, iouThreshold) {
  const sorted = [...faces].sort((a, b) => b.confidence - a.confidence)
  const kept = []
  for (const face of sorted) {
    const overlaps = kept.some(k => iou(k.box, face.box) > iouThreshold)
    if (!overlaps) kept.push(face)
  }
  return kept
}

function iou(a, b) {
  const x1 = Math.max(a.x, b.x)
  const y1 = Math.max(a.y, b.y)
  const x2 = Math.min(a.x + a.width, b.x + b.width)
  const y2 = Math.min(a.y + a.height, b.y + b.height)
  const intersection = Math.max(0, x2 - x1) * Math.max(0, y2 - y1)
  const union = a.width * a.height + b.width * b.height - intersection
  return union > 0 ? intersection / union : 0
}

// Least-squares similarity transform (rotation + uniform scale +
// translation) mapping `srcPoints` onto `dstPoints` — the standard
// Umeyama-style solve used to align detected landmarks to the ArcFace
// reference template before cropping.
function estimateSimilarityTransform(srcPoints, dstPoints) {
  const n = srcPoints.length
  let srcMeanX = 0, srcMeanY = 0, dstMeanX = 0, dstMeanY = 0
  for (let i = 0; i < n; i++) {
    srcMeanX += srcPoints[i].x; srcMeanY += srcPoints[i].y
    dstMeanX += dstPoints[i][0]; dstMeanY += dstPoints[i][1]
  }
  srcMeanX /= n; srcMeanY /= n; dstMeanX /= n; dstMeanY /= n

  let sxx = 0, sxy = 0, syx = 0, syy = 0, srcVar = 0
  for (let i = 0; i < n; i++) {
    const sx = srcPoints[i].x - srcMeanX, sy = srcPoints[i].y - srcMeanY
    const dx = dstPoints[i][0] - dstMeanX, dy = dstPoints[i][1] - dstMeanY
    sxx += dx * sx; sxy += dx * sy
    syx += dy * sx; syy += dy * sy
    srcVar += sx * sx + sy * sy
  }

  const scaleRotA = (sxx + syy) / srcVar
  const scaleRotB = (syx - sxy) / srcVar

  return {
    a: scaleRotA, b: -scaleRotB, c: scaleRotB, d: scaleRotA,
    tx: dstMeanX - (scaleRotA * srcMeanX - scaleRotB * srcMeanY),
    ty: dstMeanY - (scaleRotB * srcMeanX + scaleRotA * srcMeanY),
  }
}

module.exports = ProductionFaceModelV1
