const express = require('express')
const bcrypt  = require('bcryptjs')
const jwt     = require('jsonwebtoken')
const prisma  = require('../lib/prisma')

const router = express.Router()

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' })
    }
    const admin = await prisma.admin.findUnique({
      where: { email: email.toLowerCase().trim() }
    })
    if (!admin) {
      return res.status(401).json({ message: 'Invalid email or password.' })
    }
    const match = await bcrypt.compare(password, admin.passwordHash)
    if (!match) {
      return res.status(401).json({ message: 'Invalid email or password.' })
    }
    const token = jwt.sign(
      { adminId: admin.id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )
    return res.json({ token, admin: { id: admin.id, email: admin.email } })
  } catch (err) {
    console.error('Login error:', err)
    return res.status(500).json({ message: 'Server error. Try again.' })
  }
})

module.exports = router