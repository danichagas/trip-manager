import type { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { prisma } from '../prisma'
import dayjs from 'dayjs'
import { getMailClient } from '../lib/mail'
import nodemailer from 'nodemailer'

export async function confirmTrip(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/trips/:tripId/confirm',
    {
      schema: {
        params: z.object({
          tripId: z.string().uuid(),
        }),
      },
    },
    async (request, reply) => {
      const { tripId } = request.params

      const trip = await prisma.trip.findUnique({
        where: {
          id: tripId,
        },
        include: {
          participant: {
            where : {
              is_owner: false,
            }
          }
        }
      })

      if(!trip) {
        throw new Error('Viagem não encontrada')
      }

      if(trip.is_confrimed) {
        return reply.redirect(`http://localhost:3000/trips/${tripId}`)
      }

      await prisma.trip.update({
        where: { id: tripId },
        data: { is_confrimed: true },
      })

      const formattedStartDate = dayjs(trip.starts_at).format('LL')    
      const formattedEndDate = dayjs(trip.ends_at).format('LL')
      
      const mail = await getMailClient()

      await Promise.all(
        trip.participant.map(async (participant) => {
          const confirmationLink = `http://localhost:3333/participants/${participant.id}/confirm`

          const message = await mail.sendMail({
            from: {
              name: 'Equipe plann.er',
              address: 'hi@plann.er',
            },
            to: participant.email,
            subject: `Confirme sua presença na viagem para ${trip.destination} em ${formattedStartDate}`,
            html: `
            <div style="font-family: sans-serif; font-size: 16px; line-height: 1.6;">
              <p>Você foi convidado(a) para de uma viagem para <strong>${trip.destination}</strong> nas datas de <strong>${formattedStartDate}</strong> a <strong>${formattedEndDate}</strong>.</p>
              <p></p>
              <p>Para confirmar sua presença, clique no link abaixo: </p>
              <p></p>
              <p>
                <a href="${confirmationLink}">Confirmar viagem</a>
              </p>
              <p></p>
              <p>Caso você não saiba do que se trata esse email, apenas ignore</p>
            </div>
            `.trim(),
          })
          
          console.log(nodemailer.getTestMessageUrl(message))
        })
      )

      return reply.redirect(`http://localhost:3000/trips/${tripId}`)
    },
  )
}