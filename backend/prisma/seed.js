require('dotenv').config()
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const prisma = new PrismaClient()

async function main() {
  const ADMIN_EMAIL    = 'admin@pruview.com'   // ← your email
  const ADMIN_PASSWORD = 'Incorrect123'         // ← your password

  const existing = await prisma.admin.findUnique({ where: { email: ADMIN_EMAIL } })
  if (existing) {
    console.log('Admin already exists:', ADMIN_EMAIL)
    return
  }

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12)
  await prisma.admin.create({ data: { email: ADMIN_EMAIL, passwordHash } })
  console.log('✓ Admin created:', ADMIN_EMAIL)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())