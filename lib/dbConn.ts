import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const connectionString = process.env.DATABASE_URL

const createNoopPrisma = () => {
  const noopModel = {
    findUnique: async () => null,
    findFirst: async () => null,
    findMany: async () => [],
    create: async () => null,
    update: async () => null,
    delete: async () => null,
    upsert: async () => null,
  }

  return new Proxy(
    {
      user: noopModel,
      car: noopModel,
      order: noopModel,
      ad: noopModel,
      category: noopModel,
    },
    {
      get(target, prop) {
        if (prop in target) {
          return target[prop as keyof typeof target]
        }
        return noopModel
      },
    }
  )
}

const prismaClientSingleton = () => {
  if (!connectionString) {
    return createNoopPrisma() as unknown as PrismaClient
  }

  const pool = new Pool({ connectionString })
  const adapter = new PrismaPg(pool)
  return new PrismaClient({ adapter })
}

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma
