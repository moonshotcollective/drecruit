"use strict";
require("dotenv").config();
const defer = require("config/defer").deferConfig;
module.exports = {
  API_CONFIG: {
    contracts: {
      rpcUrl: process.env.RPC_URL,
      address: process.env.CONTRACT_ADDRESS,
    },
    api: {
      dbUrl: process.env.DB_URL,
      didKey: process.env.DID_KEY,
      environment: process.env.NODE_ENV,
      hostname: `${process.env.HOST}:${process.env.PORT}`,
      host: process.env.HOST || "localhost",
      port: process.env.PORT || 5000,
      protocol: defer(function () {
        return `http${
          this.API_CONFIG.api.environment === "development" ? "" : "s"
        }`;
      }),
      corsOptions: {
        credentials: true,
        origin: function (origin, callback) {
          const validPatternRegexes = [
            /^(.*)staging.recruiter.party(\/(.*)|)$/,
          ];
          if (validPatternRegexes.some((rx) => rx.test(origin)) || !origin) {
            callback(null, true);
          } else {
            callback(new Error("Not allowed by CORS"));
          }
        },
      },
      sessionOptions: {
        cookieName: process.env.COOKIE_NAME || "drecruit-session",
        key: process.env.COOKIE_KEY,
        cookie: {
          // options for setCookie, see https://github.com/fastify/fastify-cookie
          domain: process.env.DOMAIN,
          httpOnly: true,
          secure: false,
          sameSite: "Lax",
          path: "/",
          maxAge: 144 * 60 * 60 * 1000, // 6 days
        },
      },
    },
  },
};
