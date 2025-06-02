import type { FastifyInstance } from "fastify"
import type { ZodTypeProvider } from "fastify-type-provider-zod"
import dayjs from 'dayjs'
import nodemailer from 'nodemailer'
import { z } from "zod"
import { prisma } from "../prisma"
import { getMailClient } from "../lib/mail"

export async function createtrip(app: FastifyInstance) {
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
      throw new Error('A data de início da viagem está incorreta!')
    }

    if(dayjs(ends_at).isBefore(starts_at)) {
      throw new Error('A data de termino da viagem está incorreta!')
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
      subject: 'Testando envio de email',
      html: '<p>Testando</p>'
    })

    console.log(nodemailer.getTestMessageUrl(message))

    return { tripId: trip.id }
  })
}