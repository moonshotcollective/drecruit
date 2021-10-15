import React, { useContext, useEffect, useState } from "react";
import { Web3Context } from "../helpers/Web3Context";
import { CeramicClient } from "@ceramicnetwork/http-client";
import { ModelManager } from "@glazed/devtools";
import { DID } from "dids";
import { Ed25519Provider } from "key-did-provider-ed25519";
import { getResolver } from "key-did-resolver";
import { fromString, toString } from "uint8arrays";
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

function Home() {
  const context = useContext(Web3Context);
  const [inputNote, setInputNote] = useState("");
  const [noteSchema, setNoteSchema] = useState();
  const [ceramicManager, setCeramicManager] = useState();

  //   console.log(`🗄 context context:`, context);

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    const newSeed = toString(randomBytes(32), "base16");
    // Create and authenticate the DID
    const did = new DID({
      provider: new Ed25519Provider(fromString(newSeed, "base16")),
      resolver: getResolver(),
    });
    await did.authenticate();
    const ceramic = new CeramicClient("https://ceramic-clay.3boxlabs.com");
    ceramic.did = did;
    const manager = new ModelManager(ceramic);
    setCeramicManager(manager);

    const noteSchemaID = await manager.createSchema("SimpleNote", {
      $schema: "http://json-schema.org/draft-07/schema#",
      title: "SimpleNote",
      type: "object",
      properties: {
        text: {
          type: "string",
          title: "text",
          maxLength: 4000,
        },
      },
    });
    setNoteSchema(noteSchemaID);

    // Create the definition using the created schema ID
    await manager.createDefinition("myNote", {
      name: "My note",
      description: "A simple text note",
      schema: manager.getSchemaURL(noteSchemaID),
    });
    console.log("Ceramic: Created definition myNote");
  };

  const createNote = async () => {
    console.log("createNote ", inputNote);
    if (!noteSchema) return;
    await ceramicManager.createTile(
      "exampleNote",
      { text: "A simple note" },
      { schema: ceramicManager.getSchemaURL(noteSchema) },
    );
    console.log("create new note Ceramnic Tile");
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
        </Form>
      </div>
    </div>
  );
}

export default Home;
