require('dotenv').config()
const express = require('express')
const cors    = require('cors')
const { generatePendingNotificationsForAllAdmins } = require('./lib/notifications')
const { processNextBatch } = require('./lib/faceProcessingWorker')

const app = express()
app.use(cors({ origin: process.env.FRONTEND_URL }))
app.use(express.json())

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'pruview-backend', version : '1.0.0' })
})

app.use('/api/auth',    require('./routes/auth'))
app.use('/api/folders', require('./routes/folders'))
app.use('/api/images',  require('./routes/images'))  
app.use('/api/g',       require('./routes/gallery')) 
app.use('/api/g',       require('./routes/faces')) 
app.use('/api/images',  require('./routes/faceIndex')) 
app.use('/api/crm',     require('./routes/crm'))
app.use('/api/users',   require('./routes/users'))
app.use('/api/notifications', require('./routes/notifications'))

app.listen(process.env.PORT, () => {
  console.log(`✦ Pruview running on http://localhost:${process.env.PORT}`)
})

// Background sweep for time-based notifications (enquiry follow-ups,
// event-tomorrow reminders) — runs independently of anyone having the
// CRM open. The per-request lazy check in GET /api/notifications covers
// the gap between sweeps for whoever's actually looking.
const NOTIFICATION_SWEEP_INTERVAL_MS = 15 * 60 * 1000
setTimeout(() => generatePendingNotificationsForAllAdmins().catch(console.error), 5000)
setInterval(() => generatePendingNotificationsForAllAdmins().catch(console.error), NOTIFICATION_SWEEP_INTERVAL_MS)

// Face-processing job queue — an in-process poll loop rather than a
// separate worker/queue service (no SQS/Redis in this deployment yet).
// Picks up a small batch every few seconds so uploads never wait on AI
// processing; see faceProcessingWorker.js for the actual pipeline.
const FACE_QUEUE_POLL_INTERVAL_MS = 3000
let faceQueueBusy = false
setInterval(async () => {
  if (faceQueueBusy) return
  faceQueueBusy = true
  try {
    await processNextBatch()
  } catch (err) {
    console.error('[face-processing] batch failed:', err)
  } finally {
    faceQueueBusy = false
  }
}, FACE_QUEUE_POLL_INTERVAL_MS)