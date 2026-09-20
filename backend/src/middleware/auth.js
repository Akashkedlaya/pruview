const jwt    = require('jsonwebtoken')
const prisma = require('../lib/prisma')

async function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization']
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token. Please log in.' })
  }
  const token = authHeader.split(' ')[1]
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    const user = await prisma.user.findUnique({
      where:   { id: decoded.userId },
      include: { role: { include: { permissions: { include: { permission: true } } } } }
    })
    if (!user || user.status !== 'ACTIVE') {
      return res.status(401).json({ message: 'Invalid or expired token.' })
    }

    req.user = {
      id:          user.id,
      email:       user.email,
      name:        user.name,
      role:        user.role.name,
      adminId:     user.adminId,
      permissions: user.role.permissions.map(rp => rp.permission.key)
    }
    // Kept for the existing business-data routes, which scope every query
    // by adminId (the tenant/account) regardless of which user is logged in.
    req.adminId = user.adminId

    next()
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token.' })
  }
}

module.exports = requireAuth
