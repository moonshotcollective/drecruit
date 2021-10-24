import React, { useContext, useEffect, useState } from "react";
import { Core } from "@self.id/core";
import { Code } from "@chakra-ui/react";
import { Box, Heading, SimpleGrid, VStack } from "@chakra-ui/layout";
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
import { getNetwork, loadDRecruiterContract } from "../helpers";
import MediaCard from "../components/cards/MediaCard";
import { Layout } from "../components/layout/Layout";
import { HomeActions } from "../components/layout/HomeActions";
import { ethers } from "ethers";

function Home() {
  const context = useContext(Web3Context);
  const [inputEmail, setInputEmail] = useState("");
  const [recipients, setRecipients] = useState([]);
  const [developerProfiles, setDeveloperProfiles] = useState([]);
  const [mySelf, setMySelf] = useState();
  const [dRecruitContract, setDRecruitContract] = useState();
  const [store, setStore] = useState();
  const [prevNote, setPrevNote] = useState("");

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    const { network } = await getNetwork();
    const contract = await loadDRecruiterContract();
    setDRecruitContract(contract);
    const addresses = await window.ethereum.enable();
    console.log(addresses);
    const self = await SelfID.authenticate({
      authProvider: new EthereumAuthProvider(window.ethereum, addresses[0]),
      ceramic: CERAMIC_TESTNET,
      connectNetwork: CERAMIC_TESTNET,
      model: modelAliases,
    });
    console.log({ self });
    setMySelf(self);
    const dRecruitDevelopers = await contract.getDevelopers();
    const core = ceramicCoreFactory();
    const developersDID = await Promise.all(
      dRecruitDevelopers.map(async address => core.getAccountDID(`${address}@eip155:${network.chainId}`)),
    );
    const developerProfiles = await Promise.all(
      developersDID.map(async did => ({
        did,
        basicProfile: await core.get("basicProfile", did),
        cryptoAccounts: await core.get("cryptoAccounts", did),
        webAccounts: await core.get("alsoKnownAs", did),
        privateProfile: await core.get("privateProfile", did),
      })),
    );
    setDeveloperProfiles(developerProfiles);
    console.log(developerProfiles);
  };

  const handleRequestPrivateProfileUnlock = async (devAddress, privateProfile) => {
    const tx = await dRecruitContract.privateProfileAccessRequest(devAddress, mySelf.id, {
      value: ethers.utils.parseEther("0.1"),
    });
    const receipt = await tx.wait();
    console.log({ receipt });
  };
  const handlePrivateProfileUnlock = async privateProfile => {
    const decrypted = await await mySelf.client.ceramic.did?.decryptDagJWE(privateProfile);
    console.log({ decrypted });
    return decrypted;
  };

  return (
    <Layout>
      <HomeActions contract={dRecruitContract} mySelf={mySelf} />
      <SimpleGrid columns={4} spacing={10}>
        {developerProfiles.map(({ did, basicProfile, webAccounts, privateProfile }) => {
          const formattedAvatar = "https://ipfs.io/ipfs/" + basicProfile.image.original.src.split("//")[1];
          const formattedBg = "https://ipfs.io/ipfs/" + basicProfile.background.original.src.split("//")[1];
          return (
            <MediaCard
              key={did}
              avatarSrc={formattedAvatar}
              coverSrc={formattedBg}
              heading={basicProfile.emoji + basicProfile.name}
              subheading={`Location: ${basicProfile.residenceCountry}, ${basicProfile.homeLocation}`}
              description={basicProfile.description}
              date={`Birthdate: ${basicProfile.birthDate}`}
              primaryAction="Unlock contact informations"
              secondaryAction="View contact informations"
              hasWebAccount={!!webAccounts}
              self={mySelf}
              privateProfile={JSON.parse(privateProfile.encrypted)}
              primaryActionOnClick={handleRequestPrivateProfileUnlock}
              secondaryActionOnClick={handlePrivateProfileUnlock}
            />
          );
        })}
      </SimpleGrid>
    </Layout>
  );
}

export default Home;
