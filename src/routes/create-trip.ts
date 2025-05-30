import type { FastifyInstance } from "fastify";

export async function createtrip(app: FastifyInstance) {
  app.post('/trips', async () => {
    return 'Create trip'
  })
}