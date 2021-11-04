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
      return { statusCode: 500 }
    }
  })

  fastify.get('/nonce/:address', async (request, reply) => {
    try {
      if (!/^0x[A-Za-z0-9]{40}$/.test(request.params.address)) {
        return { statusCode: 400, message: 'Invalid address' }
      }
      const message = `Please sign this message to verify your address: ${await nanoid()}`
      await Auth.updateOne(
        { address: request.params.address },
        { message },
        { upsert: true }
      )
      return { message }
    } catch (err) {
      fastify.log.error(err)
      return { statusCode: 500 }
    }
  })

  fastify.post('/verify/:address', async (request, reply) => {
    try {
      if (!/^0x[A-Za-z0-9]{40}$/.test(request.params.address)) {
        return { statusCode: 400, message: 'Invalid address' }
      }
      console.log({ addr: request.params.address })
      const result = await Auth.findOne({
        address: request.params.address
      }).lean()

      console.log({ result })
      if (!result) {
        return { statusCode: 403, message: 'No nonce exists for address' }
      }
      const decodedAddress = await ethers.utils.verifyMessage(
        result.message,
        request.body.signature
      )
      if (decodedAddress.toLowerCase() === request.params.address) {
        const cookieSession = request.session.set('address', decodedAddress)
        console.log({ cookieSession })
        return { statusCode: 200 }
      } else {
        return { statusCode: 401 }
      }
    } catch (err) {
      fastify.log.error(err)
      return { statusCode: 500 }
    }
  })

  done()
}
