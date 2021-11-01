require("dotenv").config();
const fastify = require("fastify")({ logger: true });
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const Ipfs = require("ipfs-core");
const dagJose = require("dag-jose");
const { Core } = require("@self.id/core");
const { ethers } = require("ethers");
const { nanoid } = require("nanoid");
const { convert } = require("blockcodec-to-ipld-format");
const { DID } = require("dids");
const sodium = require("sodium-native");
const { Ed25519Provider } = require("key-did-provider-ed25519");
const KeyDidResolver = require("key-did-resolver");
const { Ceramic } = require("@ceramicnetwork/core");

const { makeCeramicClient, getDidFromTokenURI } = require("./helpers");
const model = require("./model.json");
const { Auth, Info, Resume } = require("./models");
const DRecruitAbi = require("./config/DRecruitAbi.json");
const rpcProvider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
const dRecruitContract = new ethers.Contract(
  process.env.CONTRACT_ADDRESS,
  DRecruitAbi,
  rpcProvider
);

const core = new Core({
  ceramic: "testnet-clay",
  model,
});

let ceramic;
fastify.register(require("fastify-cors"), {
  origin: ["http://localhost:3000"],
  credentials: true,
});
fastify.register(require("fastify-secure-session"), {
  cookieName: "drecruit-session",
  key: Buffer.from(process.env.COOKIE_KEY, "hex"),
  cookie: {
    path: "/",
    httpOnly: true,
    maxAge: 1000 * 24 * 60 * 60 * 3, // 3 days
    // options for setCookie, see https://github.com/fastify/fastify-cookie
  },
});

fastify.get("/did", async (request, reply) => {
  return ceramic.did.id;
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

fastify.post("/verify/:address", async (request, reply) => {
  try {
    if (!/^0x[A-Za-z0-9]{40}$/.test(request.params.address)) {
      return { statusCode: 400, message: "Invalid address" };
    }
    console.log({ addr: request.params.address });
    const result = await Auth.findOne({
      address: request.params.address,
    }).lean();

    console.log({ result });
    if (!result) {
      return { statusCode: 403, message: "No nonce exists for address" };
    }
    const decodedAddress = await ethers.utils.verifyMessage(
      result.message,
      request.body.signature
    );
    if (decodedAddress.toLowerCase() === request.params.address) {
      const cookieSession = request.session.set("address", decodedAddress);
      console.log({ cookieSession });
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
    console.log({ userAddress });
    const userBalance = await dRecruitContract.balanceOf(
      userAddress,
      request.params.tokenId
    );
    console.log({ userBalance });
    console.log(parseInt(userBalance.toString(), 10));
    if (parseInt(userBalance.toString(), 10) >= 1) {
      const tokenURI = await dRecruitContract.uri(request.params.tokenId);
      const { did } = getDidFromTokenURI(tokenURI);
      console.log({ did });
      const privateProfile = await core.get("privateProfile", did);
      console.log({ privateProfile });
      const decryptedProfile = await ceramic.did.decryptDagJWE(
        JSON.parse(privateProfile.encrypted)
      );
      console.log({ decryptedProfile });
      return { statusCode: 200, decryptedProfile };
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
    ceramic = await makeCeramicClient();
    fastify.log.info("DB connected");
    await fastify.listen(process.env.PORT || 5000, "0.0.0.0");
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
