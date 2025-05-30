import fastify from 'fastify'
import { createtrip } from './routes/create-trip'
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod'

const app = fastify()

app.setValidatorCompiler(validatorCompiler)
app.setSerializerCompiler(serializerCompiler)

app.register(createtrip)

app.listen({ port: 3333 }).then(() => {
  console.log('Server running')
})