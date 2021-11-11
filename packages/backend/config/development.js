require('dotenv').config()

module.exports = {
  API_CONFIG: {
    api: {
      corsOptions: {
        credentials: true,
        origin: function (origin, callback) {
          const validPatternRegexes = [
            /^(.*)drecruit-web-staging.herokuapp.com(\/(.*)|)$/,
            /^(www.|)drecruit-web-staging.herokuapp.com(\/(.*)|)$/,
            /^http:\/\/localhost:[0-9]{4}$/
          ]
          if (validPatternRegexes.some((rx) => rx.test(origin)) || !origin) {
            callback(null, true)
          } else {
            callback(new Error('Not allowed by CORS'))
          }
        }
      }
    }
  }
}
