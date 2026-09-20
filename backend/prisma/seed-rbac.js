// One-time (idempotent) migration: creates the Role/Permission catalog and
// backfills a User row — with role ADMIN — for every existing Admin
// (tenant) row, using its current email/passwordHash so existing logins
// keep working unchanged. Safe to re-run.
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

const RESTRICTED_PREFIXES = ['invoices.', 'users.']

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
  const agentPermissions = allPermissions.filter(
    p => !RESTRICTED_PREFIXES.some(prefix => p.key.startsWith(prefix))
  )

  // 3. Role -> Permission grants (idempotent via upsert on the composite key)
  for (const p of allPermissions) {
    await prisma.rolePermission.upsert({
      where:  { roleId_permissionId: { roleId: adminRole.id, permissionId: p.id } },
      update: {},
      create: { roleId: adminRole.id, permissionId: p.id }
    })
  }
  for (const p of agentPermissions) {
    await prisma.rolePermission.upsert({
      where:  { roleId_permissionId: { roleId: agentRole.id, permissionId: p.id } },
      update: {},
      create: { roleId: agentRole.id, permissionId: p.id }
    })
  }
  console.log(`✓ ADMIN granted ${allPermissions.length} permissions, AGENT granted ${agentPermissions.length}`)

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
