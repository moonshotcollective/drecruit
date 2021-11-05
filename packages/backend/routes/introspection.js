const { getDidFromTokenURI, selfIdCore } = require('../helpers/ceramic')

module.exports = function (fastify, opts, done) {
  fastify.get('/', async (request, reply) => {
    return { statusCode: 200, message: 'dRecruit API' }
  })

  fastify.get('/did', async (request, reply) => {
    return fastify.ceramic.client.did.id
  })

  fastify.get('/verify/:tokenId', async (request, reply) => {
    try {
      const { did } = getDidFromTokenURI(request.params.tokenId)
      const privateProfile = await selfIdCore.get('privateProfile', did)
      try {
        await fastify.ceramic.client.did.decryptDagJWE(JSON.parse(privateProfile.encrypted))
      } catch (err) {
        return { statusCode: 400 }
      }
      return { statusCode: 200 }
    } catch (err) {
      fastify.log.error(err)
      return { statusCode: 500 }
    }
  })

  done()
}
