'use strict'
require('dotenv').config()
const defer = require('config/defer').deferConfig
module.exports = {
  API_CONFIG: {
    contracts: {
      rpcUrl: process.env.RPC_URL,
      address: process.env.CONTRACT_ADDRESS
    },
    api: {
      dbUrl: process.env.DB_URL,
      didKey: process.env.DID_KEY,
      environment: process.env.NODE_ENV,
      hostname: `${process.env.HOST}:${process.env.PORT}`,
      port: process.env.PORT,
      protocol: defer(function () {
        return `http${
          this.API_CONFIG.api.environment === 'development' ? '' : 's'
        }`
      }),
      corsOptions: {
        credentials: true,
        origin: function (origin, callback) {
          const validPatternRegexes = [
            /^(.*)drecruit-web-staging.herokuapp.com(\/(.*)|)$/,
            /^(www.|)drecruit-web-staging.herokuapp.com(\/(.*)|)$/
          ]
          if (validPatternRegexes.some((rx) => rx.test(origin)) || !origin) {
            callback(null, true)
          } else {
            callback(new Error('Not allowed by CORS'))
          }
        }
      },
      sessionOptions: {
        cookieName: process.env.COOKIE_NAME,
        key: process.env.COOKIE_KEY,
        cookie: {
          // options for setCookie, see https://github.com/fastify/fastify-cookie
          httpOnly: true,
          sameSite: 'Lax',
          path: '/',
          maxAge: 144 * 60 * 60 * 1000 // 6 days
        }
      }
    }
  }
}
