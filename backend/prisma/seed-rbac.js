// Idempotent RBAC sync: creates the Role/Permission catalog, brings each
// role's grants in line with RESTRICTED_PREFIXES (adding AND revoking, so
// re-running after a policy change — e.g. Agent losing a permission it
// used to have — actually takes effect), and backfills a User row with
// role ADMIN for every existing Admin (tenant) row, using its current
// email/passwordHash so existing logins keep working unchanged.
require('dotenv').config()
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const PERMISSIONS = [
  'dashboard.read',
  'calendar.read', 'calendar.create', 'calendar.update', 'calendar.delete',
  'photographers.read', 'photographers.create', 'photographers.update', 'photographers.delete',
  'enquiries.read', 'enquiries.create', 'enquiries.update', 'enquiries.delete',
  'events.read', 'events.create', 'events.update', 'events.delete',
  'postproduction.read', 'postproduction.create', 'postproduction.update', 'postproduction.delete',
  'completed.read',
  'invoices.read', 'invoices.create', 'invoices.update', 'invoices.delete',
  'users.read', 'users.create', 'users.update', 'users.delete',
]

// Agent gets every operational permission except these prefixes.
const RESTRICTED_PREFIXES = ['invoices.', 'users.', 'completed.']

async function syncRoleGrants(role, allPermissions, allowedPermissionIds) {
  const existing = await prisma.rolePermission.findMany({ where: { roleId: role.id } })
  const existingIds = new Set(existing.map(rp => rp.permissionId))

  const toGrant = allPermissions.filter(p => allowedPermissionIds.has(p.id) && !existingIds.has(p.id))
  const toRevoke = existing.filter(rp => !allowedPermissionIds.has(rp.permissionId))

  for (const p of toGrant) {
    await prisma.rolePermission.create({ data: { roleId: role.id, permissionId: p.id } })
  }
  if (toRevoke.length > 0) {
    await prisma.rolePermission.deleteMany({
      where: { roleId: role.id, permissionId: { in: toRevoke.map(rp => rp.permissionId) } }
    })
  }
  return { granted: toGrant.length, revoked: toRevoke.length, total: allowedPermissionIds.size }
}

async function main() {
  // 1. Permissions
  for (const key of PERMISSIONS) {
    await prisma.permission.upsert({ where: { key }, update: {}, create: { key } })
  }
  console.log(`✓ ${PERMISSIONS.length} permissions ensured`)

  // 2. Roles
  const adminRole = await prisma.role.upsert({ where: { name: 'ADMIN' }, update: {}, create: { name: 'ADMIN' } })
  const agentRole = await prisma.role.upsert({ where: { name: 'AGENT' }, update: {}, create: { name: 'AGENT' } })

  const allPermissions = await prisma.permission.findMany()
  const adminAllowedIds = new Set(allPermissions.map(p => p.id))
  const agentAllowedIds = new Set(
    allPermissions.filter(p => !RESTRICTED_PREFIXES.some(prefix => p.key.startsWith(prefix))).map(p => p.id)
  )

  // 3. Sync each role's grants to exactly what it should have now
  const adminResult = await syncRoleGrants(adminRole, allPermissions, adminAllowedIds)
  const agentResult = await syncRoleGrants(agentRole, allPermissions, agentAllowedIds)
  console.log(`✓ ADMIN: ${adminResult.total} permissions (+${adminResult.granted}/-${adminResult.revoked})`)
  console.log(`✓ AGENT: ${agentResult.total} permissions (+${agentResult.granted}/-${agentResult.revoked})`)

  // 4. Backfill a User for every existing Admin (tenant), same credentials
  const admins = await prisma.admin.findMany()
  for (const admin of admins) {
    const existingUser = await prisma.user.findUnique({ where: { email: admin.email } })
    if (existingUser) {
      console.log(`- User already exists for ${admin.email}, skipping`)
      continue
    }
    await prisma.user.create({
      data: {
        email:        admin.email,
        passwordHash: admin.passwordHash,
        name:         'Admin',
        roleId:       adminRole.id,
        adminId:      admin.id,
      }
    })
    console.log(`✓ Created ADMIN user for ${admin.email}`)
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
