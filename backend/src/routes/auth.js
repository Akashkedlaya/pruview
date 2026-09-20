const express     = require('express')
const bcrypt      = require('bcryptjs')
const jwt         = require('jsonwebtoken')
const prisma      = require('../lib/prisma')
const requireAuth = require('../middleware/auth')

const router = express.Router()

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' })
    }
    const user = await prisma.user.findUnique({
      where:   { email: email.toLowerCase().trim() },
      include: { role: { include: { permissions: { include: { permission: true } } } } }
    })
    if (!user || user.status !== 'ACTIVE') {
      return res.status(401).json({ message: 'Invalid email or password.' })
    }
    const match = await bcrypt.compare(password, user.passwordHash)
    if (!match) {
      return res.status(401).json({ message: 'Invalid email or password.' })
    }
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )
    const permissions = user.role.permissions.map(rp => rp.permission.key)
    return res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role.name, permissions }
    })
  } catch (err) {
    console.error('Login error:', err)
    return res.status(500).json({ message: 'Server error. Try again.' })
  }
})

// GET /api/auth/me — resolve the current session (role + permissions),
// used by the frontend to rebuild its auth context after a page refresh.
router.get('/me', requireAuth, (req, res) => {
  return res.json({ user: req.user })
})

module.exports = router
