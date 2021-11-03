const fastify = require("fastify")({ logger: true });
const mongoose = require("mongoose");
const config = require("config");
const { makeCeramicClient } = require("./helpers/ceramic");

const { corsOptions, sessionOptions, dbUrl, port } =
  config.get("API_CONFIG.api");
fastify.register(require("fastify-cors"), {
  ...corsOptions,
});

fastify.register(require("fastify-secure-session"), {
  cookieName: sessionOptions.cookieName,
  key: Buffer.from(sessionOptions.key, "hex"),
  cookie: {
    ...sessionOptions.cookie,
  },
});

fastify.register(require("./routes"));

// Run the server!
const start = async () => {
  try {
    await mongoose.connect(dbUrl);
    fastify.log.info("DB connected");
    const client = await makeCeramicClient();
    fastify.decorate("ceramic", { client });
    await fastify.listen(port || 5000);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
