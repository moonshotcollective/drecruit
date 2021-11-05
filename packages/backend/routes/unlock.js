const { dRecruitContract } = require('../helpers/contract')
const { getDidFromTokenURI, selfIdCore } = require('../helpers/ceramic')

module.exports = function (fastify, opts, done) {
  fastify.get('/unlock/:tokenId', async (request, reply) => {
    try {
      const userAddress = request.session.get('address')
      if (!/^0x[A-Za-z0-9]{40}$/.test(userAddress)) {
        reply.code(401)
        return { message: 'Invalid/missing address in session' } // validate that address exists in session
      }
      const userBalance = await dRecruitContract.balanceOf(
        userAddress,
        request.params.tokenId
      )
      if (parseInt(userBalance.toString(), 10) >= 1) {
        const tokenURI = await dRecruitContract.uri(request.params.tokenId)
        const { did } = getDidFromTokenURI(tokenURI)
        console.log({ did })
        const privateProfile = await selfIdCore.get('privateProfile', did)
        console.log({ privateProfile })
        const decryptedProfile = await fastify.ceramic.client.did.decryptDagJWE(
          JSON.parse(privateProfile.encrypted)
        )
        console.log({ decryptedProfile })
        return { decryptedProfile }
      } else {
        reply.code(401)
        return { message: 'Address does not hold required tokens' }
      }
    } catch (err) {
      fastify.log.error(err)
      reply.code(500)
      return {}
    }
  })

  done()
}
