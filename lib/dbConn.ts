import 'server-only'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const createPrismaClient = () => {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL is required for PostgreSQL access')
  }

  const pool = new Pool({ connectionString, max: 10 })
  return new PrismaClient({ adapter: new PrismaPg(pool) })
}

declare global {
  var prismaGlobal: undefined | PrismaClient
}

function getPrismaClient() {
  if (!globalThis.prismaGlobal) globalThis.prismaGlobal = createPrismaClient()
  return globalThis.prismaGlobal
}

// Defer environment validation and connection setup until a query is made.
// That lets API route handlers catch configuration errors and return JSON
// instead of failing while Next.js is loading the route module.
const prisma = new Proxy({} as PrismaClient, {
  get(_target, property) {
    const client = getPrismaClient()
    const value = Reflect.get(client, property, client)
    return typeof value === 'function' ? value.bind(client) : value
  },
})

export default prisma
