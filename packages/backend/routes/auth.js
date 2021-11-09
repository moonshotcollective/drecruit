const { ethers } = require('ethers')
const { nanoid } = require('nanoid')
const { Auth } = require('../models')

module.exports = function (fastify, opts, done) {
  fastify.get('/authenticated', async (request, reply) => {
    try {
      const userAddress = request.session.get('address')
      if (!userAddress || !/^0x[A-Za-z0-9]{40}$/.test(userAddress)) {
        return { authenticated: false, address: null } // validate that address exists in session
      } else {
        return { authenticated: true, address: userAddress }
      }
    } catch (err) {
      fastify.log.error(err)
      reply.code(500)
      return {}
    }
  })

  fastify.get('/nonce/:address', async (request, reply) => {
    try {
      if (!/^0x[A-Za-z0-9]{40}$/.test(request.params.address)) {
        reply.code(400)
        return { message: 'Invalid address' }
      }
      const message = `Please sign this message to verify your address: ${await nanoid(10)}`
      await Auth.updateOne(
        { address: request.params.address.toLowerCase() },
        { message },
        { upsert: true }
      )
      return { message }
    } catch (err) {
      fastify.log.error(err)
      reply.code(500)
      return {}
    }
  })

  fastify.post('/verify/:address', async (request, reply) => {
    try {
      if (!/^0x[A-Za-z0-9]{40}$/.test(request.params.address)) {
        reply.code(400)
        return { message: 'Invalid address' }
      }
      console.log({ addr: request.params.address })
      const result = await Auth.findOne({
        address: request.params.address.toLowerCase()
      }).lean()

      console.log({ result })
      if (!result) {
        reply.code(401)
        return { message: 'No nonce exists for address' }
      }
      const decodedAddress = await ethers.utils.verifyMessage(
        result.message,
        request.body.signature
      )
      if (decodedAddress.toLowerCase() === result.address) {
        request.session.set('address', decodedAddress.toLowerCase())
        reply.code(200)
        return {}
      } else {
        reply.code(401)
        return {}
      }
    } catch (err) {
      fastify.log.error(err)
      reply.code(500)
      return {}
    }
  })

  done()
}
