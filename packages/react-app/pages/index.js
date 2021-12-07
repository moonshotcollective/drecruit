import React, { useCallback, useContext, useEffect, useState } from "react";
import { Core } from "@self.id/core";
import axios from "axios";
import { Button, Code, HStack, InputGroup, InputLeftElement, Box, Heading, SimpleGrid, VStack } from "@chakra-ui/react";
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
import { Table, Modal, Form, Input, Divider, InputNumber, Select, Typography, Tag, Space, PageHeader } from "antd";
import { randomBytes } from "@stablelib/random";
import { ethers } from "ethers";

import modelAliases from "../model.json";
import { ceramicCoreFactory, CERAMIC_TESTNET } from "../ceramic";
import { getDidFromTokenURI, loadDRecruitV1Contract, loadTokenContract } from "../helpers";
import MediaCard from "../components/cards/MediaCard";
import { Layout } from "../components/layout/Layout";
import { HomeActions } from "../components/layout/HomeActions";
import { FiSearch } from "react-icons/fi";
import { useDebounce } from "../hooks";
import { IPFS_GATEWAY } from "../constants";

function Home() {
  const context = useContext(Web3Context);
  const [inputEmail, setInputEmail] = useState("");
  const [recipients, setRecipients] = useState([]);
  const [developerProfiles, setDeveloperProfiles] = useState([]);
  // State and setters for ...
  // Search term
  const [searchTerm, setSearchTerm] = useState("");
  // API search results
  const [results, setResults] = useState([]);
  // Searching status (whether there is pending API request)
  const [isMatch, setIsMatch] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  // Debounce search term so that it only gives us latest value ...
  // ... if searchTerm has not been updated within last 500ms.
  // The goal is to only have the API call fire when user stops typing ...
  // ... so that we aren't hitting our API rapidly.
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [tokenContract, setTokenContract] = useState();
  const [tokenMetadata, setTokenMetadata] = useState({ name: null, symbol: null });
  const [store, setStore] = useState();
  const [prevNote, setPrevNote] = useState("");

  // Effect for API call
  useEffect(
    () => {
      if (debouncedSearchTerm) {
        setIsSearching(true);
        handleSearch(debouncedSearchTerm).then(devs => {
          setIsSearching(false);
          setIsMatch(true);
          setResults(devs);
        });
      } else {
        setResults([]);
        setIsMatch(false);
        setIsSearching(false);
      }
    },
    [debouncedSearchTerm], // Only call effect if debounced search term changes
  );

  const init = async () => {
    if (context.localProvider) {
      try {
        const contract = context.readContracts.DRecruitV1;
        if (!contract) {
          console.log("Contract DRecruitV1 not loaded yet");
          return;
        }
        if (context.rightNetwork && context.injectedProvider && context.injectedProvider.getSigner()) {
          const signer = context.injectedProvider.getSigner();
          const tokenAddress = await contract.token();
          const tokenContract = await loadTokenContract(tokenAddress, signer);
          setTokenContract(tokenContract);
          const tokenName = await tokenContract.name();
          const tokenSymbol = await tokenContract.symbol();
          setTokenMetadata({ name: tokenName, symbol: tokenSymbol });
        }
        const lastTokenId = await contract.tokenId();
        console.log("LLLLLlastTokenId: ", lastTokenId);
        const tokenIds = [...Array(parseInt(lastTokenId, 10)).keys()];
        const tokenURIs = await Promise.all(tokenIds.map(async id => contract.uri(id)));
        console.log("LLLLLtokenURIs: ", tokenURIs);
        const developersDID = [...new Set(tokenURIs.map(uri => getDidFromTokenURI(uri).did))];
        console.log("LLLLLdevelopersDID: ", developersDID);
        const core = ceramicCoreFactory();
        const basicProfile1 = await core.get("basicProfile", developersDID[0]);
        console.log("LLLLLLbasicProfile1: ", basicProfile1);
        const publicProfile1 = await core.get("publicProfile", developersDID[0]);
        console.log("LLLLLLpublicProfile1: ", publicProfile1);
        const devProfiles = await Promise.all(
          developersDID.map(async did => ({
            did,
            basicProfile: await core.get("basicProfile", did),
            cryptoAccounts: await core.get("cryptoAccounts", did),
            webAccounts: await core.get("alsoKnownAs", did),
            publicProfile: await core.get("publicProfile", did),
            privateProfile: await core.get("privateProfile", did),
          })),
        );
        console.log("devProfiles: ", devProfiles);
        setDeveloperProfiles(devProfiles);
      } catch (error) {
        console.log({ error });
      }
    }
  };

  const handleSearch = async value => {
    const foundDevs = developerProfiles.filter(({ publicProfile }) => {
      if (publicProfile) {
        const skills = publicProfile.skillTags.map(s => s.toLowerCase());
        console.log({ skills });
        const isMatch = skills.some(s => s.startsWith(value)); // skills.includes(value);
        console.log({ isMatch });
        return isMatch;
      }
      return false;
    });
    console.log({ foundDevs });
    if (!foundDevs || foundDevs.length === 0) {
      return null;
    }

    return foundDevs;
  };

  useEffect(() => {
    init();
  }, [context.readContracts.DRecruitV1, context.injectedProvider]);

  return (
    <Layout>
      <HomeActions contract={context.writeContracts.DRecruitV1} mySelf={context.self} />
      <Input type="search" placeholder="Search" onChange={e => setSearchTerm(e.target.value)} />
      {isSearching && <div>Searching ...</div>}
      <Heading>Found developers:</Heading>
      <SimpleGrid columns={4} spacing={10}>
        {isMatch &&
          results &&
          results.map(({ did, basicProfile, cryptoAccounts, webAccounts, privateProfile, publicProfile }) => {
            const formattedAvatar = basicProfile.image
              ? IPFS_GATEWAY + basicProfile.image.original.src.split("//")[1]
              : undefined;
            const formattedBg = basicProfile.background
              ? IPFS_GATEWAY + basicProfile.background.original.src.split("//")[1]
              : undefined;
            const account = Object.keys(cryptoAccounts)[0]?.split("@")[0];
            return (
              publicProfile &&
              privateProfile && (
                <MediaCard
                  key={did}
                  account={account}
                  avatarSrc={formattedAvatar}
                  coverSrc={formattedBg}
                  publicProfile={publicProfile}
                  heading={basicProfile.emoji + " " + basicProfile.name}
                  subheading={`${
                    basicProfile.residenceCountry || basicProfile.homeLocation
                      ? "Location: " +
                        basicProfile.residenceCountry +
                        (basicProfile.homeLocation ? ", " + basicProfile.homeLocation : "")
                      : ""
                  }`}
                  description={basicProfile.description}
                  date={`Birthdate: ${basicProfile.birthDate}`}
                  primaryAction="Request contact information"
                  secondaryAction="View contact information"
                  hasWebAccount={!!webAccounts}
                  privateProfile={privateProfile}
                  tokenContract={tokenContract}
                  tokenMetadata={tokenMetadata}
                />
              )
            );
          })}
      </SimpleGrid>
      <Heading>All developers:</Heading>
      <SimpleGrid
        columns={{
          sm: 1,
          md: 3,
          lg: 3,
        }}
        spacing={5}
      >
        {developerProfiles.map(({ did, basicProfile, cryptoAccounts, webAccounts, privateProfile, publicProfile }) => {
          const formattedAvatar = basicProfile.image
            ? IPFS_GATEWAY + basicProfile.image.original.src.split("//")[1]
            : undefined;
          const formattedBg = basicProfile.background
            ? IPFS_GATEWAY + basicProfile.background.original.src.split("//")[1]
            : undefined;
          const account = Object.keys(cryptoAccounts)[0]?.split("@")[0];
          return (
            publicProfile &&
            privateProfile && (
              <MediaCard
                key={did}
                account={account}
                avatarSrc={formattedAvatar}
                coverSrc={formattedBg}
                publicProfile={publicProfile}
                heading={basicProfile.emoji + " " + basicProfile.name}
                subheading={`${
                  basicProfile.residenceCountry || basicProfile.homeLocation
                    ? "Location: " +
                      basicProfile.residenceCountry +
                      (basicProfile.homeLocation ? ", " + basicProfile.homeLocation : "")
                    : ""
                }`}
                description={basicProfile.description}
                date={`Birthdate: ${basicProfile.birthDate}`}
                primaryAction="Request contact information"
                secondaryAction="View contact information"
                hasWebAccount={!!webAccounts}
                privateProfile={privateProfile}
                tokenContract={tokenContract}
                tokenMetadata={tokenMetadata}
              />
            )
          );
        })}
      </SimpleGrid>
    </Layout>
  );
}

export default Home;
