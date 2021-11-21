import { Badge, Spacer, Box, Center, Heading, Link, SimpleGrid, Stack, Text } from "@chakra-ui/layout";
import React, { useCallback, useContext, useEffect, useState } from "react";
import { EthereumAuthProvider, SelfID, WebClient } from "@self.id/web";
import { getSlicedAddress, loadDRecruitV1Contract } from "../../../helpers";

import { ceramicCoreFactory, CERAMIC_TESTNET } from "../../../ceramic";
import modelAliases from "../../../model.json";
import { LinkIcon } from "@chakra-ui/icons";
import { Button } from "@chakra-ui/button";
import { Avatar } from "@chakra-ui/avatar";
import { useColorModeValue } from "@chakra-ui/color-mode";
import { Layout } from "../../../components/layout/Layout";
import { Web3Context } from "../../../helpers/Web3Context";
import Blockies from "react-blockies";

import { useToast } from "@chakra-ui/react";
import { NETWORKS } from "../../../constants";

function ApproveShareContactInformation() {
  const context = useContext(Web3Context);
  const [contract, setContract] = useState();
  const [requesters, setRequesters] = useState();
  const [accessRequests, setAccessRequests] = useState();
  const [myPrivateProfile, setMyPrivateProfile] = useState();
  const [recruiters, setRecruiters] = useState([]);

  const toast = useToast();

  const init = async () => {
    if (context.injectedProvider && context.injectedProvider.getSigner() && context.self) {
      const dRecruitV1Contract = await loadDRecruitV1Contract(
        context.targetNetwork,
        context.injectedProvider.getSigner(),
      );
      setContract(dRecruitV1Contract);
      const addresses = await window.ethereum.enable();
      const privateProfile = await context.self.get("privateProfile");
      if (!privateProfile) {
        return;
      }
      setMyPrivateProfile(privateProfile);
      const reqs = await dRecruitV1Contract.getRequesters(privateProfile.tokenId);
      setRequesters(reqs);
      console.log(context.injectedProvider);
      const core = ceramicCoreFactory();
      const recruiterDIDs = await Promise.allSettled(
        reqs.map(recruiterAddress => core.getAccountDID(`${recruiterAddress}@eip155:${context.targetNetwork.chainId}`)),
      );
      const recruiterProfiles = await Promise.all(
        recruiterDIDs.map(async (did, idx) => {
          if (did.status == "fulfilled") {
            const profile = await core.get("basicProfile", did.value);
            const formattedAvatar =
              profile && profile.image ? "https://ipfs.io/ipfs/" + profile.image.original.src.split("//")[1] : null;
            return {
              address: reqs[idx],
              ...profile,
              avatar: formattedAvatar,
            };
          } else {
            return {
              address: reqs[idx],
            };
          }
        }),
      );
      setRecruiters(recruiterProfiles);
    }
  };
  useEffect(() => {
    init();
  }, [context]);

  const handleApproval = useCallback(
    async requesterAddress => {
      // const decrypted = await context.self.client.ceramic.did?.decryptDagJWE(JSON.parse(myPrivateProfile.encrypted));
      // console.log({ decrypted });
      // const core = ceramicCoreFactory();
      // const recruiter = `${requesterAddress}@eip155:${context.targetNetwork.chainId}`;
      // console.log({ recruiter });
      // const did = await core.getAccountDID(recruiter);
      // console.log({ requesterAddress });
      try {
        const tx = await contract.approveRequest(myPrivateProfile.tokenId, requesterAddress);
        toast({
          title: "Approval transaction sent",
          description: (
            <text>
              Your transaction was successfully sent{" "}
              <a href={`${NETWORKS.mumbai.blockExplorer}/tx/${tx.hash}`} target="_blank" rel="noopener noreferrer">
                <LinkIcon color="white" />
              </a>
            </text>
          ),
          status: "success",
        });
        const receipt = await tx.wait();
        toast({
          title: "Approval transaction confirmed",
          description: (
            <text>
              Your transaction was confirmed{" "}
              <a href={`${NETWORKS.mumbai.blockExplorer}/tx/${tx.hash}`} target="_blank" rel="noopener noreferrer">
                <LinkIcon color="white" />
              </a>
            </text>
          ),
          status: "success",
        });
      } catch (err) {
        toast({
          title: "Approval transaction failed",
          description: err.message + (err.data ? ` ${err.data.message}` : ""),
          status: "error",
        });
      }
    },
    [context, myPrivateProfile],
  );
  return (
    <Layout>
      {requesters && requesters.length > 0 ? (
        <SimpleGrid columns={4} spacing={10}>
          {recruiters.map(recruiter => (
            <Center py={6} key={recruiter.address}>
              <Box
                maxW={"320px"}
                w={"full"}
                h="450px"
                bg={useColorModeValue("white", "gray.900")}
                boxShadow={"2xl"}
                rounded={"lg"}
                p={6}
                textAlign={"center"}
              >
                {recruiter.avatar ? (
                  <Avatar size={"xl"} src={recruiter.avatar} alt={"Avatar Alt"} mb={4} pos={"relative"} />
                ) : (
                  <Box justifyContent="center" display="flex">
                    <Blockies size={10} seed={recruiter.address.toLowerCase()} className="blockies" scale={10} />
                  </Box>
                )}

                <br />
                <Badge px={2} py={1} bg={useColorModeValue("gray.50", "gray.800")} fontWeight={"400"}>
                  {getSlicedAddress(recruiter.address)}
                </Badge>
                <Heading fontSize={"2xl"} fontFamily={"body"}>
                  {recruiter.emoji || ""} {recruiter.name || "Anonymous"}
                </Heading>
                {recruiter.url && (
                  <Text fontWeight={600} color={"gray.500"} mb={4}>
                    <Link href={recruiter.url}>{recruiter.url}</Link>
                  </Text>
                )}
                {recruiter.description ? (
                  <Text textAlign={"center"} color={useColorModeValue("gray.700", "gray.400")} px={3}>
                    {recruiter.description}
                  </Text>
                ) : (
                  <Spacer />
                )}
                <Stack align={"center"} justify={"center"} direction={"row"} mt={6}>
                  <Badge px={2} py={1} bg={useColorModeValue("gray.50", "gray.800")} fontWeight={"400"}>
                    #Design
                  </Badge>
                  <Badge px={2} py={1} bg={useColorModeValue("gray.50", "gray.800")} fontWeight={"400"}>
                    #Project management
                  </Badge>
                </Stack>

                <Stack mt={8} direction={"row"} spacing={4}>
                  <Button
                    flex={1}
                    fontSize={"sm"}
                    rounded={"full"}
                    _focus={{
                      bg: "gray.200",
                    }}
                  >
                    Message
                  </Button>
                  <Button
                    flex={1}
                    fontSize={"sm"}
                    rounded={"full"}
                    bg={"blue.400"}
                    color={"white"}
                    onClick={() => handleApproval(recruiter.address)}
                    boxShadow={"0px 1px 25px -5px rgb(66 153 225 / 48%), 0 10px 10px -5px rgb(66 153 225 / 43%)"}
                    _hover={{
                      bg: "blue.500",
                    }}
                    _focus={{
                      bg: "blue.500",
                    }}
                  >
                    Approve
                  </Button>
                </Stack>
              </Box>
            </Center>
          ))}
        </SimpleGrid>
      ) : (
        <Box>Approve or reject recruiter request</Box>
      )}
    </Layout>
  );
}

export default ApproveShareContactInformation;
