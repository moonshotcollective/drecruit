import { Core } from "@self.id/core";
import modelAliases from "../model.json";

export const CERAMIC_TESTNET = "testnet-clay";
export const CERAMIC_TESTNET_NODE_URL = "https://ceramic-clay.3boxlabs.com";
export const CERAMIC_MAINNET_NODE_URL = "https://gateway.ceramic.network";
export const CERAMIC_LOCAL_NODE_URL = "http://localhost:7007";

// READ ONLY CLIENT
export const ceramicCoreFactory = () => {
  // connect to a known URL
  // const core = new Core({ ceramic: "http://localhost:7007" });
  // or use one of the preconfigured option
  const core = new Core({
    ceramic: CERAMIC_TESTNET_NODE_URL,
    model: modelAliases,
  });
  return core;
};
