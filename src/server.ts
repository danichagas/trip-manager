import fastify from 'fastify'
import { PrismaClient } from './generated/prisma'

export const prisma = new PrismaClient({
  log: ['query']
})

const app = fastify()

app.get('/create', async () => {
  await prisma.trip.create({
    data: {
      destination: 'Pará',
      starts_at: new Date(),
      ends_at: new Date(),
    },
  })
  return 'Registrado com sucesso'
})

app.get('/registers', async () => {
  const trips = await prisma.trip.findMany()
  return trips
})

app.listen({ port: 3333 }).then(() => {
  console.log('Server running')
})