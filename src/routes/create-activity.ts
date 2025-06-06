import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { prisma } from '../prisma'
import dayjs from 'dayjs'
import { ClientError } from '../errors/client-error'

export async function createActivity(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post('/trips/:tripId/activities', {
    schema: {
      params: z.object({
        tripId: z.string().uuid(),
      }),
      body: z.object({
        title: z.string().min(4),
        occurs_at: z.coerce.date(),
      }),
    },
  }, async (request) => {
    const { tripId } = request.params
    const { title, occurs_at } = request.body

    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
    })

    if(!trip) {
      throw new ClientError('Viagem não encontrada!')
    }

    if(dayjs(occurs_at).isBefore(trip.starts_at)) {
      throw new ClientError('Data da atividade está errada!')
    }

    if(dayjs(occurs_at).isAfter(trip.ends_at)) {
      throw new ClientError('Data da atividade está errada!')
    }

    const activity = await prisma.activity.create({
      data: {
        title,
        occurs_at,
        trip_id: tripId,
      },
    })

    return { activityId: activity.id }
  })
}