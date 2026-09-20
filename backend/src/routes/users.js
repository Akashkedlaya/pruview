const express = require('express')
const bcrypt  = require('bcryptjs')
const prisma  = require('../lib/prisma')
const requireAuth = require('../middleware/auth')
const { requirePermission } = require('../middleware/permissions')

const router = express.Router()
router.use(requireAuth)

function toDTO(user) {
  return {
    id:        user.id,
    email:     user.email,
    name:      user.name,
    status:    user.status,
    role:      user.role.name,
    createdAt: user.createdAt
  }
}

// GET /api/users — list users in the caller's account
router.get('/', requirePermission('users.read'), async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where:   { adminId: req.adminId },
      include: { role: true },
      orderBy: { createdAt: 'asc' }
    })
    return res.json(users.map(toDTO))
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Could not load users.' })
  }
})

// POST /api/users — create a user with a role
router.post('/', requirePermission('users.create'), async (req, res) => {
  try {
    const { email, password, name, role } = req.body
    if (!email || !password || !role) {
      return res.status(400).json({ message: 'Email, password and role are required.' })
    }
    const roleRow = await prisma.role.findUnique({ where: { name: role } })
    if (!roleRow) return res.status(400).json({ message: 'Invalid role.' })

    const passwordHash = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        passwordHash,
        name: name || null,
        roleId: roleRow.id,
        adminId: req.adminId
      },
      include: { role: true }
    })
    return res.status(201).json(toDTO(user))
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(400).json({ message: 'A user with this email already exists.' })
    }
    console.error(err)
    return res.status(500).json({ message: 'Could not create user.' })
  }
})

// PUT /api/users/:id — edit name/role/status, or reset password
router.put('/:id', requirePermission('users.update'), async (req, res) => {
  try {
    const userId = parseInt(req.params.id)
    const existing = await prisma.user.findFirst({ where: { id: userId, adminId: req.adminId } })
    if (!existing) return res.status(404).json({ message: 'User not found.' })

    const { name, role, status, password } = req.body
    const data = {}
    if (name !== undefined) data.name = name
    if (status !== undefined) {
      if (userId === req.user.id && status !== 'ACTIVE') {
        return res.status(400).json({ message: 'You cannot disable your own account.' })
      }
      data.status = status
    }
    if (role) {
      const roleRow = await prisma.role.findUnique({ where: { name: role } })
      if (!roleRow) return res.status(400).json({ message: 'Invalid role.' })
      if (userId === req.user.id && roleRow.name !== req.user.role) {
        return res.status(400).json({ message: 'You cannot change your own role.' })
      }
      data.roleId = roleRow.id
    }
    if (password) data.passwordHash = await bcrypt.hash(password, 12)

    const user = await prisma.user.update({
      where:   { id: userId },
      data,
      include: { role: true }
    })
    return res.json(toDTO(user))
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Could not update user.' })
  }
})

// DELETE /api/users/:id
router.delete('/:id', requirePermission('users.delete'), async (req, res) => {
  try {
    const userId = parseInt(req.params.id)
    if (userId === req.user.id) {
      return res.status(400).json({ message: 'You cannot delete your own account.' })
    }
    const existing = await prisma.user.findFirst({ where: { id: userId, adminId: req.adminId } })
    if (!existing) return res.status(404).json({ message: 'User not found.' })

    await prisma.user.delete({ where: { id: userId } })
    return res.json({ message: 'User deleted.' })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Could not delete user.' })
  }
})

module.exports = router
