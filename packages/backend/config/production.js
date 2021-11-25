require("dotenv").config();

module.exports = {
  API_CONFIG: {
    api: {
      sessionOptions: {
        cookieName: process.env.COOKIE_NAME || "drecruit-session",
        key: process.env.COOKIE_KEY,
        cookie: {
          // options for setCookie, see https://github.com/fastify/fastify-cookie
          domain: process.env.DOMAIN,
          secure: true,
          sameSite: "None",
          httpOnly: true,
          path: "/",
          maxAge: 144 * 60 * 60 * 1000, // 6 days
        },
      },
    },
  },
};
