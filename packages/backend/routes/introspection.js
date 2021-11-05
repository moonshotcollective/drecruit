const { dRecruitContract } = require('../helpers/contract')
const { getDidFromTokenURI, selfIdCore } = require('../helpers/ceramic')

module.exports = function (fastify, opts, done) {
  fastify.get('/', async (request, reply) => {
    return { message: 'dRecruit API' }
  })

  fastify.get('/did', async (request, reply) => {
    return fastify.ceramic.client.did.id
  })

  fastify.get('/status/:tokenId', async (request, reply) => {
    try {
      const tokenUri = await dRecruitContract.uri(request.params.tokenId)
      const { did } = getDidFromTokenURI(tokenUri)
      const privateProfile = await selfIdCore.get('privateProfile', did)
      try {
        await fastify.ceramic.client.did.decryptDagJWE(JSON.parse(privateProfile.encrypted))
      } catch (err) {
        reply.code(400)
        return {}
      }
      return {}
    } catch (err) {
      fastify.log.error(err)
      reply.code(500)
      return {}
    }
  })

  done()
}
