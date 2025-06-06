import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import nodemailer from 'nodemailer'
import { prisma } from '../prisma'
import dayjs from 'dayjs'
import { getMailClient } from '../lib/mail'
import { ClientError } from '../errors/client-error'

export async function createInvite(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post('/trips/:tripId/invites', {
    schema: {
      params: z.object({
        tripId: z.string().uuid(),
      }),
      body: z.object({
        email: z.string().email(),
      }),
    },
  }, async (request) => {
    const { tripId } = request.params
    const { email } = request.body

    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
    })

    if(!trip) {
      throw new ClientError('Viagem não encontrada!')
    }

    const participant = await prisma.participant.create({
      data: {
        email,
        trip_id: tripId,
      },
    })

    const formattedStartDate = dayjs(trip.starts_at).format('LL')    
    const formattedEndDate = dayjs(trip.ends_at).format('LL')       
          
    const mail = await getMailClient()
    
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

    return { participantId: participant.id }
  })
}