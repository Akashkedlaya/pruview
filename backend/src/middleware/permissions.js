// Centralized RBAC guard. Every protected route declares the permission
// key it needs; requireAuth has already attached req.user.permissions
// (resolved fresh from Role -> RolePermission -> Permission on each
// request), so adding a new role or changing a role's grants never
// requires touching route code.
function requirePermission(key) {
  return (req, res, next) => {
    if (!req.user || !req.user.permissions.includes(key)) {
      return res.status(403).json({ message: 'Forbidden' })
    }
    next()
  }
}

module.exports = { requirePermission }
