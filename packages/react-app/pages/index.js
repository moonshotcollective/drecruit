import React, { useContext, useEffect, useState } from "react";
import { Core } from "@self.id/core";
import { Code } from "@chakra-ui/react";
import { Box, Heading, VStack } from "@chakra-ui/layout";
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
  const [inputEmail, setInputEmail] = useState("");
  const [decryptedEmail, setDecryptedEmail] = useState("");
  const [encryptedEmail, setEncryptedEmail] = useState("");
  const [recipients, setRecipients] = useState([]);
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
    console.log(await self.get("basicProfile"));
    console.log(self.id);
  };

  const saveEmail = async () => {
    // approval
    // const devMapping = {
    //   "0xDEV1": ["did:3:approved-recruiter1", "did:3:approved-recruiter2"],
    //   "0xDEV2": ["did:3:approved-recruiter1", "did:3:approved-recruiter3"],
    // };
    // // claim
    // claimStakeFromRecruiter("did:3:approved-recruiter1");
    // const approvedRecruiters = await contract.get("loggedInDevAddress");
    // // ["did of approved recruiters"]
    const test = await profile.client.ceramic.did?.createDagJWE(
      {
        email: inputEmail,
      },
      [
        // logged-in user,
        profile.id,
        devMapping[address],
      ],
    );

    const privateProfile = await profile.get("privateProfile");
    console.log({ privateProfile });

    console.log({ test });
    const testSignature = await profile.client.ceramic.did?.createDagJWS(test, {
      did: profile.id,
    });
    const testSignatureCid = testSignature.jws.link.toString();
    console.log({ testSignatureCid });
    setStore(test);
    await profile.set("privateProfile", { email: JSON.stringify(test) });
    setEncryptedEmail(JSON.stringify(test, null, 2));
    // const newNote = await model.createTile("SimpleNote", { text: "My new note" });
    // await store.set("privateProfile", { text: inputEmail });
    // const note = await store.get("privateProfile");
  };

  const decryptEmail = async () => {
    const core = ceramicCoreFactory();
    const basic = await profile.get("basicProfile");
    const { email } = await core.get("privateProfile", profile.id);
    setEncryptedEmail(email);
    console.log({ email });
    const jweObj = JSON.parse(email);
    console.log({ jweObj });
    const { email: decryptedEmail } = await profile.client.ceramic.did?.decryptDagJWE(jweObj);
    setDecryptedEmail(decryptedEmail);
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
          <Form.Item name="email" label="Email">
            <Input
              size="large"
              placeholder="Enter email"
              allowClear={true}
              type="email"
              style={{
                width: "100%",
              }}
              onChange={e => setInputEmail(e.target.value)}
            />
          </Form.Item>
          {/* <FormControl isInvalid={errors.candidates}>
            <FormLabel htmlFor="candidates">Candidates</FormLabel>
            {fields.map((field, index) => (
              <HStack pb="1rem" justify="space-between">
                <Text>Voter {index + 1}</Text>
                <HStack>
                  <InputGroup w="300px">
                    <ControllerPlus
                      key={field.id} // important to include key with field's id
                      {...register(`candidates.${index}.value`)}
                      transform={{
                        input: (value: any) => {
                          console.log(value);
                          return value;
                        },
                        output: (e: any) => e.target.value,
                      }}
                      control={control}
                    />
                    <InputRightElement p="2.5" children={<QRCodeIcon />} />
                  </InputGroup>
                  <Icon _hover={{ cursor: "pointer" }} color="red.500" as={FiX} onClick={() => remove(index)} />
                </HStack>
              </HStack>
            ))}
            <FormErrorMessage>{errors.voteAllocation && errors.voteAllocation.message}</FormErrorMessage>
          </FormControl> */}
          <Button ml="0.5rem" onClick={saveEmail} px="1.25rem" fontSize="md">
            Save Email
          </Button>
          <Button ml="0.5rem" onClick={decryptEmail} px="1.25rem" fontSize="md">
            Decrypt Email
          </Button>
        </Form>
      </div>
      <VStack p="20">
        <Box>
          <Heading size="md">Decrypted Email:</Heading>
          <Code>{decryptedEmail}</Code>
        </Box>
        <Box>
          <Heading size="md">Encrypted Email:</Heading>
          <Code>{encryptedEmail}</Code>
        </Box>
      </VStack>
    </div>
  );
}

export default Home;
