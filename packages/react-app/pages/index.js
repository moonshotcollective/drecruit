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
import { randomBytes } from "@stablelib/random";

import modelAliases from "../model.json";
import { ceramicCoreFactory, CERAMIC_TESTNET } from "../ceramic";

function Home() {
  const context = useContext(Web3Context);
  const [inputNote, setInputNote] = useState("");
  const [profile, setProfile] = useState();
  const [store, setStore] = useState();
  const [prevNote, setPrevNote] = useState("");

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    const addresses = await window.ethereum.enable();
    console.log(addresses);
    const self = await SelfID.authenticate({
      authProvider: new EthereumAuthProvider(window.ethereum, addresses[0]),
      ceramic: CERAMIC_TESTNET,
      connectNetwork: CERAMIC_TESTNET,
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
      [
        // swap
        "did:3:kjzl6cwe1jw14af9j9s5mer7pucy92k27ghn1ugya0qv8o1bg7pvoizkghze36n",
        // dev
        "did:3:kjzl6cwe1jw149l83btp3gcv9pukggag54zpbkv8n0zc1osdnh5y7ttm9xd6ff1",
        // dev2
        "did:3:kjzl6cwe1jw14ak540gcaypdzvx8fjwluuokafdtbxhligrvpoizmav4tjupaat",
      ],
    );
    const testSignature = await profile.client.ceramic.did?.createDagJWS(test, {
      did: profile.id,
    });
    const testSignatureCid = testSignature.jws.link.toString();
    setStore(test);
    await profile.set("myNote", { text: JSON.stringify(test) });
    // const newNote = await model.createTile("SimpleNote", { text: "My new note" });
    // await store.set("myNote", { text: inputNote });
    // const note = await store.get("myNote");
  };

  const getNote = async () => {
    const core = ceramicCoreFactory();
    const basic = await profile.get("basicProfile");
    console.log({ basic });
    const note = await core.get("myNote", "did:3:kjzl6cwe1jw149l83btp3gcv9pukggag54zpbkv8n0zc1osdnh5y7ttm9xd6ff1");
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
