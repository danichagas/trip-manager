import fastify from 'fastify'
import cors from '@fastify/cors'
import { createtrip } from './routes/create-trip'
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod'
import { confirmTrip } from './routes/confirm-trip'

const app = fastify()

app.register(cors, {
  origin: true
})

app.setValidatorCompiler(validatorCompiler)
app.setSerializerCompiler(serializerCompiler)

app.register(createtrip)
app.register(confirmTrip)

app.listen({ port: 3333 }).then(() => {
  console.log('Server running')
})