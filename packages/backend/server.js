require('dotenv').config()
const fastify = require('fastify')({ logger: true })
const mongoose = require('mongoose')
const { makeCeramicClient } = require('./helpers/ceramic')

fastify.register(require('fastify-cors'), {
  origin: [
    'http://localhost:3000',
    'https://drecruit-web-staging.herokuapp.com',
    'http://drecruit-web-staging.herokuapp.com'
  ],
  credentials: true
})

fastify.register(require('fastify-secure-session'), {
  cookieName: 'drecruit-session',
  key: Buffer.from(process.env.COOKIE_KEY, 'hex'),
  cookie: {
    path: '/',
    httpOnly: true,
    maxAge: 1000 * 24 * 60 * 60 * 3 // 3 days
    // options for setCookie, see https://github.com/fastify/fastify-cookie
  }
})

fastify.register(require('./routes'))

// Run the server!
const start = async () => {
  try {
    await mongoose.connect(process.env.DB_URL)
    fastify.log.info('DB connected')
    const client = await makeCeramicClient()
    fastify.decorate('ceramic', { client })
    await fastify.listen(process.env.PORT || 5000, '0.0.0.0')
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()
