import React, { useContext, useEffect, useState } from "react";
import { Core } from "@self.id/core";
import { Web3Context } from "../helpers/Web3Context";
import { CeramicClient } from "@ceramicnetwork/http-client";
import { ModelManager } from "@glazed/devtools";
import { DID } from "dids";
import { Ed25519Provider } from "key-did-provider-ed25519";
import { getResolver } from "key-did-resolver";
import { fromString, toString } from "uint8arrays";
import { DataModel } from "@glazed/datamodel";
import { DIDDataStore } from "@glazed/did-datastore";
import { EthereumAuthProvider, SelfID, WebClient } from "@self.id/web";
import {
  Button,
  Table,
  Modal,
  Form,
  Input,
  Divider,
  InputNumber,
  Select,
  Typography,
  Tag,
  Space,
  PageHeader,
} from "antd";
const { randomBytes } = require("@stablelib/random");
import modelAliases from "../model.json";

function Home() {
  const context = useContext(Web3Context);
  const [inputNote, setInputNote] = useState("");
  const [profile, setProfile] = useState();
  const [store, setStore] = useState();
  const [prevNote, setPrevNote] = useState("");

  //   console.log(`🗄 context context:`, context);

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    // console.log(modelAliases);
    // Create and authenticate the DID
    let newSeed = process.env.REACT_APP_CERAMIC_SEED;
    // if (!process.env.REACT_APP_CERAMIC_SEED) {
    //   console.warn("REACT_APP_CERAMIC_SEED not found in .env, generating a new seed..");
    //   newSeed = toString(randomBytes(32), "base16");
    //   console.log(`Seed generated. Save this in your .env as REACT_APP_CERAMIC_SEED=${newSeed}`);
    //   process.env.REACT_APP_CERAMIC_SEED = newSeed;
    // }
    // const did = new DID({
    //   provider: new Ed25519Provider(fromString(newSeed, "base16")),
    //   resolver: getResolver(),
    // });
    // await did.authenticate();

    // const ceramic = new CeramicClient(process.env.CERAMIC_URL || "https://ceramic-clay.3boxlabs.com");
    // ceramic.did = did;
    // console.log({ did });

    // const model = new DataModel({ ceramic, model: modelAliases });
    // setModel(model);
    // const store = new DIDDataStore({ ceramic, model });
    // setStore(store);

    // const exampleNote = await model.loadTile("exampleNote");
    // console.log("loaded note", exampleNote);

    // const note = await store.get("myNote");
    // if (note) {
    //   console.log({ note });
    //   setPrevNote(note.text);
    // }

    const addresses = await window.ethereum.enable();
    console.log(addresses);
    // const authProvider = new EthereumAuthProvider(window.ethereum, addresses[0]);
    // const client = new WebClient({ ceramic: "testnet-clay", connectNetwork: "testnet-clay", model: modelAliases });
    // const did = await client.authenticate(authProvider);
    // console.log({ did });
    // // A SelfID instance can only be created with an authenticated DID
    // const self = new SelfID({ client, did });
    const self = await SelfID.authenticate({
      authProvider: new EthereumAuthProvider(window.ethereum, addresses[0]),
      ceramic: "testnet-clay",
      connectNetwork: "testnet-clay",
      model: modelAliases,
    });
    console.log({ self });
    setProfile(self);
    await self.set("basicProfile", { name: "Alice" });
    console.log(await self.get("basicProfile"));
    console.log(self.id);
  };

  const createNote = async () => {
    console.log("createNote ", inputNote);

    const note = await profile.get("myNote");
    console.log({ note });
    const test = await profile.client.ceramic.did?.createDagJWE(
      {
        note: {
          text: "hello",
        },
      },
      ["did:3:kjzl6cwe1jw14af9j9s5mer7pucy92k27ghn1ugya0qv8o1bg7pvoizkghze36n"],
    );
    console.log({ test });
    setStore(test);
    await profile.set("myNote", { text: JSON.stringify(test) });
    // const newNote = await model.createTile("SimpleNote", { text: "My new note" });
    // await store.set("myNote", { text: inputNote });
    // const note = await store.get("myNote");
  };

  const getNote = async () => {
    const basic = await profile.get("basicProfile");
    console.log({ basic });
    const note = await profile.get("myNote");
    console.log({ note });
    const jweObj = JSON.parse(note.text);
    console.log({ jweObj });
    const res = await profile.client.ceramic.did?.decryptDagJWE(jweObj);
    console.log({ res });
  };

  return (
    <div className="flex flex-1 flex-col h-screen w-full items-center">
      <div className="text-center" style={{ margin: 64 }}>
        <span>This App is powered by Scaffold-eth & Next.js </span>
        <span>and is ready for your next Moonshot!!</span>
        <br />
        <span>
          Added{" "}
          <a href="https://tailwindcomponents.com/cheatsheet/" target="_blank" rel="noreferrer">
            TailwindCSS
          </a>{" "}
          for easier styling.
        </span>
        <div>
          <Typography.Title level={3}>Previous Note from Ceramic: {prevNote}</Typography.Title>
        </div>
        <Form style={{ margin: "2em 12em" }} layout="vertical" name="createForm" autoComplete="off">
          <Form.Item name="note" label="Note">
            <Input
              size="large"
              placeholder="Enter Note"
              allowClear={true}
              style={{
                width: "100%",
              }}
              onChange={e => setInputNote(e.target.value)}
            />
          </Form.Item>
          <Button ml="0.5rem" onClick={createNote} px="1.25rem" fontSize="md">
            Create New Note
          </Button>
          <Button ml="0.5rem" onClick={getNote} px="1.25rem" fontSize="md">
            Refresh
          </Button>
        </Form>
      </div>
    </div>
  );
}

export default Home;
