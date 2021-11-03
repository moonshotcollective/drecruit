module.exports = function (fastify, opts, done) {
  fastify.get('/', async (request, reply) => {
    return { statusCode: 200, message: 'dRecruit API' }
  })

  fastify.get('/did', async (request, reply) => {
    return fastify.ceramic.client.did.id
  })

  done()
}
