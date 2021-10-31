require("dotenv").config();
const fastify = require("fastify")({ logger: true });
const mongoose = require("mongoose");
const Ipfs = require("ipfs-core");
const dagJose = require("dag-jose");
const { Core } = require("@self.id/core");
const { ethers } = require("ethers");
const { nanoid } = require("nanoid");
const { convert } = require("blockcodec-to-ipld-format");
const { DID } = require("dids");
const { Ed25519Provider } = require("key-did-provider-ed25519");
const KeyDidResolver = require("key-did-resolver");
const { Ceramic } = require("@ceramicnetwork/core");
const { Auth, Info, Resume } = require("./models");

const dagJoseFormat = convert(dagJose);
let ipfs;

const provider = new Ed25519Provider(
  Buffer.from(process.env.CERAMIC_SEED, "hex")
);
const did = new DID({ provider, resolver: KeyDidResolver.getResolver() });
const ceramicCore = new Core({
  ceramic: "testnet-clay",
});

fastify.register(require("fastify-secure-session"), {
  cookieName: "drecruit-session",
  key: process.env.COOKIE_KEY,
  cookie: {
    path: "/",
    httpOnly: true,
    maxAge: 1000 * 24 * 60 * 60 * 3, // 3 days
    // options for setCookie, see https://github.com/fastify/fastify-cookie
  },
});

fastify.get("/did", async (request, reply) => {
  return ceramicCore.ceramic.did.id;
});

fastify.get("/nonce/:address", async (request, reply) => {
  try {
    if (!/^0x[A-Za-z0-9]{40}$/.test(request.params.address)) {
      return { statusCode: 400, message: "Invalid address" };
    }
    const message = `Please sign this message to verify your address: ${await nanoid()}`;
    await Auth.updateOne(
      { address: request.params.address },
      { message },
      { upsert: true }
    );
    return { message };
  } catch (err) {
    fastify.log.error(err);
    return { statusCode: 500 };
  }
});

fastify.get("/verify/:address", async (request, reply) => {
  try {
    if (!/^0x[A-Za-z0-9]{40}$/.test(request.params.address)) {
      return { statusCode: 400, message: "Invalid address" };
    }
    const result = await Auth.findOne({
      address: request.params.address,
    }).lean();
    if (!result) {
      return { statusCode: 403, message: "No nonce exists for address" };
    }
    const decodedAddress = await ethers.utils.verifyMessage(
      result.message,
      request.body.signature
    );
    if (decodedAddress === request.params.address) {
      request.session.set("address", decodedAddress);
      return { statusCode: 200 };
    } else {
      return { statusCode: 401 };
    }
  } catch (err) {
    fastify.log.error(err);
    return { statusCode: 500 };
  }
});

fastify.post("/resume", async (request, reply) => {
  try {
    if (!/^0x[A-Za-z0-9]{40}$/.test(request.params.address)) {
      return { statusCode: 400, message: "Invalid address" };
    }
    const result = await Auth.findOne({
      address: request.params.address,
    }).lean();
    if (!result) {
      return { statusCode: 403, message: "No nonce exists for address" };
    }
    const decodedAddress = await ethers.utils.verifyMessage(
      result.message,
      request.body.signature
    );
    if (decodedAddress === request.params.address) {
      request.session.set("address", decodedAddress);
      return { statusCode: 200 };
    } else {
      return { statusCode: 401 };
    }
  } catch (err) {
    fastify.log.error(err);
    return { statusCode: 500 };
  }
});

fastify.get("/unlock/:tokenId", async (request, reply) => {
  try {
    const userAddress = request.session.get("address");
    if (!/^0x[A-Za-z0-9]{40}$/.test(userAddress)) {
      return { statusCode: 401, message: "Invalid/missing address in session" }; // validate that address exists in session
    }
    const userBalance = dRecruitContract.balanceOf(
      userAddress,
      request.params.tokenId
    );
    if (userBalance >= 1) {
      // this will ideally be changed to fetching the CID from the stream, and the stream ID is stored on-chain

      const result = await Info.findOne({
        tokenId: request.params.tokenId,
      }).lean();
      const jwe = await ipfs.dag.get(result.contentId);
      const cleartext = await did.decryptDagJWE(jwe);
      return { message: cleartext };
    } else {
      return {
        statusCode: 401,
        message: "Address does not hold required tokens",
      };
    }
  } catch (err) {
    fastify.log.error(err);
    return { statusCode: 500 };
  }
});

// Run the server!
const start = async () => {
  try {
    await mongoose.connect(process.env.DB_URL);
    // ipfs = await Ipfs.create({ ipld: { formats: [dagJoseFormat] } });
    // const ceramic = await Ceramic.create(ipfs);
    // ceramic.did = did;
    // ceramic.did.setProvider(provider);
    // await ceramic.did.authenticate();
    fastify.log.info("DB connected");
    await fastify.listen(process.env.PORT || 5000);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
