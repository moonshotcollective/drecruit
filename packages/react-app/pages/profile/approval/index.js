import { Badge, Box, Center, Heading, Link, SimpleGrid, Stack, Text } from "@chakra-ui/layout";
import React, { useCallback, useContext, useEffect, useState } from "react";
import { EthereumAuthProvider, SelfID, WebClient } from "@self.id/web";
import { loadDRecruitV1Contract } from "../../../helpers";

import { ceramicCoreFactory, CERAMIC_TESTNET } from "../../../ceramic";
import modelAliases from "../../../model.json";
import { Button } from "@chakra-ui/button";
import { Avatar } from "@chakra-ui/avatar";
import { useColorModeValue } from "@chakra-ui/color-mode";
import { Layout } from "../../../components/layout/Layout";
import { Web3Context } from "../../../helpers/Web3Context";

function ApproveShareContactInformation() {
  const context = useContext(Web3Context);
  const [contract, setContract] = useState();
  const [requesters, setRequesters] = useState();
  const [accessRequests, setAccessRequests] = useState();
  const [myPrivateProfile, setMyPrivateProfile] = useState();
  const [recruiters, setRecruiters] = useState([]);

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
      const recruiterDIDs = await Promise.all(
        reqs.map(recruiterAddress =>
          core.getAccountDID(`${recruiterAddress}@eip155:${context.injectedProvider._network.chainId}`),
        ),
      );
      const recruiterProfiles = await Promise.all(
        recruiterDIDs.map(async (did, idx) => {
          const profile = await core.get("basicProfile", did);
          const formattedAvatar = profile.image
            ? "https://ipfs.io/ipfs/" + profile.image.original.src.split("//")[1]
            : null;
          return {
            address: reqs[idx],
            ...profile,
            avatar: formattedAvatar,
          };
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
      const decrypted = await context.self.client.ceramic.did?.decryptDagJWE(JSON.parse(myPrivateProfile.encrypted));
      console.log({ decrypted });
      const core = ceramicCoreFactory();
      const recruiter = `${requesterAddress}@eip155:${context.targetNetwork.chainId}`;
      console.log({ recruiter });
      const did = await core.getAccountDID(recruiter);
      console.log({ requesterAddress });
      const tx = await contract.approveRequest(myPrivateProfile.tokenId, requesterAddress);
      const receipt = await tx.wait();
      return receipt;
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
                bg={useColorModeValue("white", "gray.900")}
                boxShadow={"2xl"}
                rounded={"lg"}
                p={6}
                textAlign={"center"}
              >
                <Avatar
                  size={"xl"}
                  src={
                    recruiter.avatar ||
                    "https://images.unsplash.com/photo-1520810627419-35e362c5dc07?ixlib=rb-1.2.1&q=80&fm=jpg&crop=faces&fit=crop&h=200&w=200&ixid=eyJhcHBfaWQiOjE3Nzg0fQ"
                  }
                  alt={"Avatar Alt"}
                  mb={4}
                  pos={"relative"}
                  _after={{
                    content: '""',
                    w: 4,
                    h: 4,
                    bg: "green.300",
                    border: "2px solid white",
                    rounded: "full",
                    pos: "absolute",
                    bottom: 0,
                    right: 3,
                  }}
                />
                <br />
                <Badge px={2} py={1} bg={useColorModeValue("gray.50", "gray.800")} fontWeight={"400"}>
                  {recruiter.address.slice(0, 10)}
                </Badge>
                <Heading fontSize={"2xl"} fontFamily={"body"}>
                  {recruiter.emoji} {recruiter.name}
                </Heading>
                <Text fontWeight={600} color={"gray.500"} mb={4}>
                  <Link href={recruiter.url}>{recruiter.url}</Link>
                </Text>
                <Text textAlign={"center"} color={useColorModeValue("gray.700", "gray.400")} px={3}>
                  {recruiter.description}
                </Text>

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
