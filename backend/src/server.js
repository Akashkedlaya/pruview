require('dotenv').config()
const express = require('express')
const cors    = require('cors')

const app = express()
app.use(cors({ origin: process.env.FRONTEND_URL }))
app.use(express.json())

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'pruview-backend', version : '1.0.0' })
})

app.use('/api/auth',    require('./routes/auth'))
app.use('/api/folders', require('./routes/folders'))
app.use('/api/images',  require('./routes/images'))  
app.use('/api/g',       require('./routes/gallery'))  // ← add this

app.listen(process.env.PORT, () => {
  console.log(`✦ Pruview running on http://localhost:${process.env.PORT}`)
})