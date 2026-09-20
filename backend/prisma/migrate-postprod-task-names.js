// One-time data migration: renames existing PostProductionTask rows from
// the old process-stage names to the new deliverable-type names, keeping
// each task's status/assignee/dueDate/order untouched — only taskName
// changes. "Final Delivery" has no counterpart in the new 5-task list
// and is intentionally left as-is. Safe to re-run (a second pass finds
// no more rows with the old names and renames nothing).
require('dotenv').config()
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const RENAME_MAP = {
  'Culling':       'Sneak Peek',
  'Basic Editing': 'Candid Video',
  'Retouching':    'Traditional Video',
  'Album Design':  'Candid Pictures',
  'Client Review': 'Traditional Pictures',
}

async function main() {
  for (const [oldName, newName] of Object.entries(RENAME_MAP)) {
    const result = await prisma.postProductionTask.updateMany({
      where: { taskName: oldName },
      data:  { taskName: newName }
    })
    console.log(`✓ Renamed ${result.count} task(s): "${oldName}" -> "${newName}"`)
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
