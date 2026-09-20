const prisma = require('./prisma')
const { appToday, addDays } = require('./dates')

const FOLLOW_UP_DAYS = 3

async function alreadyExists(where) {
  return !!(await prisma.notification.findFirst({ where }))
}

// Enquiries created >=3 calendar days ago that are still active (not yet
// archived/converted) get a follow-up notification. Uses >= rather than
// == so a missed cron window (e.g. server downtime) still catches up
// instead of silently skipping the notification forever.
async function generateEnquiryFollowUps(adminId) {
  const cutoff = addDays(appToday(), -FOLLOW_UP_DAYS)
  const candidates = await prisma.enquiry.findMany({
    where: {
      adminId,
      status:    { not: 'ARCHIVED' },
      createdAt: { lte: cutoff }
    }
  })

  for (const enquiry of candidates) {
    const exists = await alreadyExists({ type: 'ENQUIRY_FOLLOW_UP', relatedEnquiryId: enquiry.id })
    if (exists) continue
    try {
      await prisma.notification.create({
        data: {
          adminId,
          type:             'ENQUIRY_FOLLOW_UP',
          title:             'Enquiry follow-up',
          message:           `Follow up with ${enquiry.coupleName} regarding their enquiry.`,
          relatedEnquiryId:  enquiry.id
        }
      })
    } catch (err) {
      if (err.code !== 'P2002') throw err // unique constraint race — already created, safe to ignore
    }
  }
}

// Events starting tomorrow (app-timezone calendar day) get a reminder.
async function generateEventTomorrowReminders(adminId) {
  const tomorrow = addDays(appToday(), 1)
  const dayAfterTomorrow = addDays(tomorrow, 1)

  const candidates = await prisma.event.findMany({
    where: {
      adminId,
      startDate: { gte: tomorrow, lt: dayAfterTomorrow }
    }
  })

  for (const event of candidates) {
    const exists = await alreadyExists({ type: 'EVENT_TOMORROW', relatedEventId: event.id })
    if (exists) continue
    try {
      await prisma.notification.create({
        data: {
          adminId,
          type:            'EVENT_TOMORROW',
          title:           'Event tomorrow',
          message:         `${event.coupleName} event is tomorrow.`,
          relatedEventId:  event.id
        }
      })
    } catch (err) {
      if (err.code !== 'P2002') throw err
    }
  }
}

async function generatePendingNotifications(adminId) {
  await generateEnquiryFollowUps(adminId)
  await generateEventTomorrowReminders(adminId)
}

async function generatePendingNotificationsForAllAdmins() {
  const admins = await prisma.admin.findMany({ select: { id: true } })
  for (const admin of admins) {
    await generatePendingNotifications(admin.id).catch(err => {
      console.error(`Notification generation failed for admin ${admin.id}:`, err)
    })
  }
}

// Triggered synchronously right after a successful enquiry->event
// conversion, not by the background job — this one is event-driven,
// not time-driven.
async function notifyEventConverted(adminId, event) {
  try {
    await prisma.notification.create({
      data: {
        adminId,
        type:            'EVENT_CONVERTED',
        title:           'Enquiry converted',
        message:         `${event.coupleName} has been successfully converted to an event.`,
        relatedEventId:  event.id
      }
    })
  } catch (err) {
    if (err.code !== 'P2002') throw err
  }
}

module.exports = {
  generatePendingNotifications,
  generatePendingNotificationsForAllAdmins,
  notifyEventConverted,
}
