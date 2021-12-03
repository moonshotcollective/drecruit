import React, { useCallback, useContext, useEffect, useState } from "react";
import { Core } from "@self.id/core";
import axios from "axios";
import {
  Button,
  Code,
  HStack,
  InputGroup,
  InputLeftElement,
  Box,
  Heading,
  SimpleGrid,
  VStack,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
} from "@chakra-ui/react";
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
  const [isAlertOpen, setIsAlertOpen] = React.useState(false);
  const onAlertClose = async () => {
    const data = [
      {
        chainId: "0x" + context.targetNetwork.chainId.toString(16),
        chainName: context.targetNetwork.name,
        nativeCurrency: context.targetNetwork.nativeCurrency,
        rpcUrls: [context.targetNetwork.rpcUrl],
        blockExplorerUrls: [context.targetNetwork.blockExplorer],
      },
    ];
    try {
      await ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: data[0].chainId }],
      });
      setIsAlertOpen(false);
    } catch (switchError) {
      // This error code indicates that the chain has not been added to MetaMask.
      if (switchError.code === 4902) {
        try {
          await ethereum.request({
            method: "wallet_addEthereumChain",
            params: data,
          });
          setIsAlertOpen(false);
        } catch (addError) {
          console.log(addError);
        }
      }
      // handle other "switch" errors
    }
  };
  const cancelRef = React.useRef();
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
  const [dRecruitContract, setDRecruitContract] = useState();
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
    if (context.injectedProvider && context.injectedProvider.getSigner()) {
      try {
        const signer = context.injectedProvider.getSigner();
        const contract = await loadDRecruitV1Contract(context.targetNetwork, signer);
        const tokenAddress = await contract.token();
        const tokenContract = await loadTokenContract(tokenAddress, signer);
        setDRecruitContract(contract);
        setTokenContract(tokenContract);
        const tokenName = await tokenContract.name();
        const tokenSymbol = await tokenContract.symbol();
        setTokenMetadata({ name: tokenName, symbol: tokenSymbol });
        const lastTokenId = await contract.tokenId();
        const tokenIds = [...Array(parseInt(lastTokenId, 10)).keys()];
        const tokenURIs = await Promise.all(tokenIds.map(async id => contract.uri(id)));
        const developersDID = [...new Set(tokenURIs.map(uri => getDidFromTokenURI(uri).did))];
        const core = ceramicCoreFactory();
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
        setDeveloperProfiles(devProfiles);
      } catch (error) {
        console.log({ error });
        setIsAlertOpen(true);
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
  }, [context.injectedProvider]);

  return (
    <Layout>
      <AlertDialog isOpen={isAlertOpen} leastDestructiveRef={cancelRef}>
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Switch network
            </AlertDialogHeader>

            <AlertDialogBody>
              To use this app you must switch to the {context.targetNetwork.name} network.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onAlertClose} colorScheme="blue">
                Switch
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
      <HomeActions contract={dRecruitContract} mySelf={context.self} />
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
            const account = Object.keys(cryptoAccounts)[0].split("@")[0];
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
                  dRecruitContract={dRecruitContract}
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
          const account = Object.keys(cryptoAccounts)[0].split("@")[0];
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
                dRecruitContract={dRecruitContract}
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
