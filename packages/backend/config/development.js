require("dotenv").config();

module.exports = {
  API_CONFIG: {
    api: {
      sessionOptions: {
        cookieName: process.env.COOKIE_NAME || "drecruit-session-dev",
        key: process.env.COOKIE_KEY,
        cookie: {
          // options for setCookie, see https://github.com/fastify/fastify-cookie
          secure: false,
          httpOnly: true,
          path: "/",
          maxAge: 144 * 60 * 60 * 1000, // 6 days
        },
      },
      corsOptions: {
        credentials: true,
        origin: function (origin, callback) {
          const validPatternRegexes = [
            /^(.*)staging.recruiter.party(\/(.*)|)$/,
            /^http:\/\/localhost:[0-9]{4}$/,
          ];
          if (validPatternRegexes.some((rx) => rx.test(origin)) || !origin) {
            callback(null, true);
          } else {
            callback(new Error("Not allowed by CORS"));
          }
        },
      },
    },
  },
};
