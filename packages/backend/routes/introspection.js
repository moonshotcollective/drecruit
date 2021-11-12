const sjson = require("secure-json-parse");
const { dRecruitContract } = require("../helpers/contract");
const { getDidFromTokenURI, selfIdCore } = require("../helpers/ceramic");

module.exports = function (fastify, opts, done) {
  fastify.get("/", async (request, reply) => {
    return { message: "dRecruit API" };
  });

  fastify.get("/did", async (request, reply) => {
    return fastify.ceramic.client.did.id;
  });

  fastify.get("/status/:tokenId", async (request, reply) => {
    try {
      const tokenUri = await dRecruitContract.uri(request.params.tokenId);
      const { did } = getDidFromTokenURI(tokenUri);
      const privateProfile = await selfIdCore.get("privateProfile", did);
      if (privateProfile) {
        try {
          await fastify.ceramic.client.did.decryptDagJWE(
            sjson.parse(privateProfile.encrypted)
          );
        } catch (err) {
          reply.code(400);
          return {};
        }
        reply.code(404);
        return {};
      }
    } catch (err) {
      fastify.log.error(err);
      reply.code(500);
      return {};
    }
  });

  done();
};
