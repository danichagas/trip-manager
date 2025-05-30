import type { FastifyInstance } from "fastify"
import type { ZodTypeProvider } from "fastify-type-provider-zod"
import dayjs from 'dayjs'
import { z } from "zod"
import { prisma } from "../prisma"

export async function createtrip(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post('/trips', {
    schema: {
      body: z.object({
        destination: z.string().min(4),
        starts_at: z.coerce.date(),
        ends_at: z.coerce.date(),
      }),
    },
  }, async (request) => {
    const { destination, starts_at, ends_at } = request.body

    if(dayjs(starts_at).isBefore(new Date())) {
      throw new Error('A data de início da viagem está incorreta!')
    }

    if(dayjs(ends_at).isBefore(starts_at)) {
      throw new Error('A data de termino da viagem está incorreta!')
    }

    const trip = await prisma.trip.create({
      data: {
        destination,
        starts_at,
        ends_at
      },
    })

    return { tripId: trip.id }
  })
}