import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import dayjs from 'dayjs'
import localizedFormat from 'dayjs/plugin/localizedFormat'
import 'dayjs/locale/pt-br'
import nodemailer from 'nodemailer'
import { z } from 'zod'
import { prisma } from "../prisma"
import { getMailClient } from '../lib/mail'
import { ClientError } from '../errors/client-error'

dayjs.locale('pt-br')
dayjs.extend(localizedFormat)

export async function createTrip(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post('/trips', {
    schema: {
      body: z.object({
        destination: z.string().min(4),
        starts_at: z.coerce.date(),
        ends_at: z.coerce.date(),
        owner_name: z.string(),
        owner_email: z.string().email(),
        emails_to_invite: z.array(z.string().email())
      }),
    },
  }, async (request) => {
    const { destination, starts_at, ends_at, owner_name, owner_email, emails_to_invite } = request.body

    if(dayjs(starts_at).isBefore(new Date())) {
      throw new ClientError('A data de início da viagem está incorreta!')
    }

    if(dayjs(ends_at).isBefore(starts_at)) {
      throw new ClientError('A data de termino da viagem está incorreta!')
    }

    const trip = await prisma.trip.create({
      data: {
        destination,
        starts_at,
        ends_at,
        participant: {
          createMany: {
            data: [
              {
                name: owner_name,
                email: owner_email,
                is_owner: true,
                is_confirmed: true,
              },
              ...emails_to_invite.map(email => {
                return { email }
              })
            ]
          }
        },
      },
    })

    const formattedStartDate = dayjs(starts_at).format('LL')    
    const formattedEndDate = dayjs(ends_at).format('LL')

    const confirmationLink = `http://localhost:3333/trips/${trip.id}/confirm`

    const mail = await getMailClient()

    const message = await mail.sendMail({
      from: {
        name: 'Equipe plann.er',
        address: 'hi@plann.er',
      },
      to: {
        name: owner_name,
        address: owner_email,
      },
      subject: `Confirme sua viagem para ${destination} em ${formattedStartDate}`,
      html: `
        <div style="font-family: sans-serif; font-size: 16px; line-height: 1.6;">
        <p>Você solicitou a criação de uma viagem para <strong>${destination}</strong> nas datas de <strong>${formattedStartDate}</strong> a <strong>${formattedEndDate}</strong>.</p>
        <p></p>
        <p>Para confirmar sua viagem, clique no link abaixo: </p>
        <p></p>
        <p>
          <a href="${confirmationLink}">Confirmar viagem</a>
        </p>
        <p></p>
        <p>Caso você não saiba do que se trata esse email, apenas ignore</p>
        </div>
      `.trim()
    })

    console.log(nodemailer.getTestMessageUrl(message))

    return { tripId: trip.id }
  })
}