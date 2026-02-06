import { PrismaClient } from "@prisma/client"

interface CustomNodeJsGlobal extends Global {
  prisma: PrismaClient | undefined
}

declare const global: CustomNodeJsGlobal

const prisma =
  global.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  })

if (process.env.NODE_ENV === "development") global.prisma = prisma

export { prisma }
