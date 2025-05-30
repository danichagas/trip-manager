import fastify from 'fastify'
import { PrismaClient } from './generated/prisma'
import { createtrip } from './routes/create-trip'

export const prisma = new PrismaClient({
  log: ['query']
})

const app = fastify()

app.register(createtrip)

app.listen({ port: 3333 }).then(() => {
  console.log('Server running')
})