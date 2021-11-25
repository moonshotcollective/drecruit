const { CeramicClient } = require("@ceramicnetwork/http-client");
const { Core } = require("@self.id/core");
const { DID } = require("dids");
const { Ed25519Provider } = require("key-did-provider-ed25519");
const { getResolver } = require("key-did-resolver");
const { fromString } = require("uint8arrays");
const crypto = require("crypto");
const model = require("../model.json");

const CERAMIC_TESTNET_NODE_URL = "https://ceramic-clay.3boxlabs.com";

const selfIdCore = new Core({
  ceramic: "testnet-clay",
  model,
});

const getDidFromTokenURI = (tokenURI) => {
  const [, , cid, didFilename] = tokenURI.split("/");
  const [did] = didFilename.split(".json");
  return {
    did,
    cid,
    tokenURI,
    filename: didFilename,
  };
};

const makeCeramicClient = async () => {
  if (!process.env.DID_KEY) {
    console.warn("DID_KEY not found in .env, generating a new seed..");
    const newSeed = toString(crypto.randomBytes(32), "base16");
    console.log(`Seed generated. Save this in your .env as DID_KEY=${newSeed}`);
    process.env.DID_KEY = newSeed;
  }
  const key = fromString(process.env.DID_KEY, "base16");
  // Create and authenticate the DID
  const did = new DID({
    provider: new Ed25519Provider(key),
    resolver: getResolver(),
  });
  await did.authenticate();

  // Connect to the testnet local Ceramic node
  const ceramic = new CeramicClient(CERAMIC_TESTNET_NODE_URL);
  ceramic.did = did;
  return ceramic;
};

module.exports = { getDidFromTokenURI, makeCeramicClient, selfIdCore };
