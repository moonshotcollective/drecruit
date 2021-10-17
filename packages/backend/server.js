require('dotenv').config()
const fastify = require('fastify')({ logger: true })
const mongoose = require('mongoose')
const nanoid = require('nanoid')

fastify.get('/', async (request, reply) => {
  return 'dRecruit API'
})

fastify.get('/nonce/:address', async (request, reply) => {
  try {
    if (!/^0x[A-Za-z0-9]{40}$/.test(request.params.address)) {
      return { statusCode: 400, message: 'Invalid address' }
    }
    // create in db
  } catch (err) {
    fastify.log.error(err)
    return { statusCode: 500 }
  }
})

// Run the server!
const start = async () => {
  try {
    await mongoose.connect(process.env.DB_URI)
    await fastify.listen(3000)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()
