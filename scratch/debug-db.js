process.env.DATABASE_URL = "postgresql://postgres.gcfddxwfcxggpiewhhlb:Fv7PSTlhYJvAwyn1@aws-0-eu-west-1.pooler.supabase.com:5432/postgres"
const { PrismaClient } = require('../prisma/generated/client')
const prisma = new PrismaClient()

async function debug() {
  try {
    const userCount = await prisma.user.count()
    console.log("Total Users in DB:", userCount)

    const allUsers = await prisma.user.findMany({
      select: { username: true, hustleScore: true, mode: true }
    })
    console.log("All Users in DB:", allUsers)

    const guestCount = await prisma.guestScore.count()
    console.log("Total GuestScores in DB:", guestCount)

    const guestScores = await prisma.guestScore.findMany({
        select: { username: true, hustleScore: true }
    })
    console.log("Guest Scores:", guestScores)

  } catch (error) {
    console.error("DEBUG FAILED:", error.message)
  } finally {
    await prisma.$disconnect()
  }
}

debug()
