import {
  Stack,
  Image,
  Tag,
  TagLabel,
  Box,
  HStack,
  Flex,
  Heading,
  Text,
  Avatar,
  Spinner,
  useDisclosure,
  List,
  ListItem,
} from "@chakra-ui/react";
import { Icon, EmailIcon, InfoIcon, PhoneIcon, LinkIcon } from "@chakra-ui/icons";
import React, { useContext, useEffect, useState } from "react";
import { useColorModeValue } from "@chakra-ui/color-mode";
import { useFieldArray, useForm } from "react-hook-form";
import { EthereumAuthProvider, SelfID, WebClient } from "@self.id/web";
import { useRouter } from "next/router";
import axios from "axios";
import { ethers } from "ethers";
import { loadDRecruitV1Contract, loadTokenContract } from "../../../helpers";
import UnlockProfile from "../../../components/UnlockProfile";

import modelAliases from "../../../model.json";
import { ceramicCoreFactory, CERAMIC_TESTNET, CERAMIC_TESTNET_NODE_URL } from "../../../ceramic";
import { Web3Context } from "../../../helpers/Web3Context";

import { IPFS_GATEWAY } from "../../../constants";

const ViewProfilePage = () => {
  const context = useContext(Web3Context);
  const router = useRouter();
  const did = router.query.did;
  const [imageURL, setImageURL] = useState();
  const [backgroundURL, setBackgroundURL] = useState();
  const [basicProfile, setBasicProfile] = useState();
  const [publicProfile, setPublicProfile] = useState();
  const [privateProfile, setPrivateProfile] = useState();
  const [decryptedData, setDecryptedData] = useState();
  const [canView, setCanView] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dRecruitContract, setDRecruitContract] = useState();
  const [tokenContract, setTokenContract] = useState();

  const { isOpen, onOpen, onClose } = useDisclosure();

  const bgColor = useColorModeValue("white", "gray.800");

  useEffect(() => {
    // get initial state from Ceramic
    (async () => {
      if (context.self && context.injectedProvider && context.injectedProvider.getSigner()) {
        const signer = context.injectedProvider.getSigner();
        const contract = await loadDRecruitV1Contract(context.targetNetwork, signer);
        setDRecruitContract(contract);
        const tokenAddress = await contract.token();
        const tokenContract = await loadTokenContract(tokenAddress, signer);
        setTokenContract(tokenContract);
        const basicProfile = await context.self.client.dataStore.get("basicProfile", did);
        setBasicProfile(basicProfile);
        const publicProfile = await context.self.client.dataStore.get("publicProfile", did);
        setPublicProfile(publicProfile);
        const privateProfile = await context.self.client.dataStore.get("privateProfile", did);
        setPrivateProfile(privateProfile);
        setLoading(false);
        try {
          const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/unlock/${privateProfile.tokenId}`, {
            withCredentials: true,
          });
          if (response.status !== 200) {
            return setCanView(false);
          }
          setCanView(true);
          setDecryptedData(response.data.decryptedProfile);
        } catch (error) {
          setCanView(false);
        }
      }
    })();
  }, [context.self, context.injectedProvider]);

  return (
    <>
      <Box margin="0 auto" maxWidth={1100} transition="0.5s ease-out">
        {loading ? (
          <Spinner />
        ) : (
          <Box w={"full"} bg={bgColor} boxShadow={"2xl"} rounded={"3xl"} overflow={"hidden"} my="5">
            <Image
              alt="cover"
              h={"120px"}
              w={"full"}
              src={
                basicProfile && basicProfile.background
                  ? IPFS_GATEWAY + basicProfile.background.original.src.split("//")[1]
                  : "https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=774&q=80"
              }
              objectFit="cover"
            />
            <Flex justify={"center"} mt={-12}>
              {basicProfile && basicProfile.image && (
                <Avatar
                  size={"xl"}
                  src={IPFS_GATEWAY + basicProfile.image.original.src.split("//")[1]}
                  alt={"Author"}
                  css={{
                    border: "2px solid white",
                  }}
                />
              )}
            </Flex>
            <Box p={6}>
              <Stack spacing={0} align="left" mb={5}>
                <Heading fontSize={"2xl"} fontWeight={600} fontFamily={"body"}>
                  {basicProfile && basicProfile.name ? basicProfile.emoji + " " + basicProfile.name : "Anonymous"}
                </Heading>
                <Heading fontSize={"lg"} fontWeight={500} fontFamily={"body"}>
                  {basicProfile && basicProfile.description}
                </Heading>
                <Text color={"gray.500"}>
                  {`${
                    basicProfile && (basicProfile.residenceCountry || basicProfile.homeLocation)
                      ? "Location: " +
                        basicProfile.residenceCountry +
                        (basicProfile.homeLocation ? ", " + basicProfile.homeLocation : "")
                      : ""
                  }`}
                </Text>
                <Text color={"gray.500"}>
                  {basicProfile && basicProfile.birthDate && `Birthdate: ${basicProfile.birthDate}`}
                </Text>
              </Stack>
              {publicProfile && publicProfile.skillTags && (
                <HStack spacing={4}>
                  {publicProfile.skillTags.map(skill => (
                    <Tag size="md" key={skill} colorScheme="cyan">
                      <TagLabel alt={skill}>{skill}</TagLabel>
                    </Tag>
                  ))}
                </HStack>
              )}
              {publicProfile && publicProfile.experiences && (
                <Box style={{ marginTop: 20 }}>
                  <Heading fontSize={"lg"} fontWeight={500} fontFamily={"body"}>
                    Experiences
                  </Heading>
                  <List>
                    {publicProfile.experiences.map((exp, index) => (
                      <ListItem key={index}>{exp}</ListItem>
                    ))}
                  </List>
                </Box>
              )}
              {decryptedData && (
                <Box maxW="full" p="6">
                  <Stack spacing={0} align="left" mb={5}>
                    <HStack align="center">
                      <Icon as={BsFillPersonLinesFill} />
                      <Text fontWeight="bold">
                        {decryptedData.firstname} {decryptedData.lastname}
                      </Text>
                    </HStack>
                    <HStack align="center">
                      <EmailIcon />
                      <Text fontWeight="bold"> {decryptedData.email}</Text>
                    </HStack>
                    <HStack>
                      <PhoneIcon />
                      <Text fontWeight="bold">{decryptedData.phone}</Text>
                    </HStack>
                    <HStack>
                      <Icon as={GrLocation} />
                      <Text fontWeight="bold">{decryptedData.physicalAddress}</Text>
                    </HStack>
                  </Stack>
                </Box>
              )}
              <UnlockProfile
                canView={canView}
                dRecruitContract={dRecruitContract}
                tokenContract={tokenContract}
                privateProfile={privateProfile}
              />
            </Box>
          </Box>
        )}
      </Box>
    </>
  );
};

export default ViewProfilePage;
