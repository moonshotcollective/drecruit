const fs = require("fs");
const { ModelManager } = require("@glazed/devtools");
const { CeramicClient } = require("@ceramicnetwork/http-client");
const { DID } = require("dids");
const { Ed25519Provider } = require("key-did-provider-ed25519");
const { getResolver } = require("key-did-resolver");
const { fromString, toString } = require("uint8arrays");
const { randomBytes } = require("@stablelib/random");

const schemas = require("./schemas");
const basicProfile = require("@datamodels/identity-profile-basic");
const cryptoAccounts = require("@datamodels/identity-accounts-crypto");
const webAccounts = require("@datamodels/identity-accounts-web");

async function publishModel() {
  let newSeed = process.env.REACT_APP_CERAMIC_SEED;
  if (!process.env.REACT_APP_CERAMIC_SEED) {
    console.warn("REACT_APP_CERAMIC_SEED not found in .env, generating a new seed..");
    newSeed = toString(randomBytes(32), "base16");
    console.log(`Seed generated. Save this in your .env as REACT_APP_CERAMIC_SEED=${newSeed}`);
    process.env.REACT_APP_CERAMIC_SEED = newSeed;
  }
  const did = new DID({
    provider: new Ed25519Provider(fromString(newSeed, "base16")),
    resolver: getResolver(),
  });
  await did.authenticate();
  const ceramic = new CeramicClient(process.env.CERAMIC_URL || "https://ceramic-clay.3boxlabs.com");
  ceramic.did = did;

  const manager = new ModelManager(ceramic);
  manager.addJSONModel(basicProfile.model);
  manager.addJSONModel(cryptoAccounts.model);
  manager.addJSONModel(webAccounts.model);
  for (const [schemaName, schema] of Object.entries(schemas)) {
    console.log(schemaName, schema);
    const schemaId = await manager.createSchema(schemaName, schema);
    await manager.createDefinition("privateProfile", {
      name: "Private profile",
      description: "Private encrypted profile",
      schema: manager.getSchemaURL(schemaId),
    });
  }

  const model = await manager.toPublished();
  console.log({ model });
  await fs.promises.writeFile("./model.json", JSON.stringify(model));
}

(async () => {
  await publishModel();
})();
