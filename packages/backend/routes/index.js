module.exports = function (fastify, opts, done) {
  fastify.register(require('./auth.js'))
  fastify.register(require('./unlock.js'))
  fastify.register(require('./introspection.js'))
  done()
}
