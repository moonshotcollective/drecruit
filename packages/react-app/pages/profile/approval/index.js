import { Badge, Box, Center, Heading, Link, SimpleGrid, Stack, Text } from "@chakra-ui/layout";
import React, { useCallback, useEffect, useState } from "react";
import { EthereumAuthProvider, SelfID, WebClient } from "@self.id/web";
import { getNetwork, loadDRecruitV1Contract } from "../../../helpers";

import { ceramicCoreFactory, CERAMIC_TESTNET } from "../../../ceramic";
import modelAliases from "../../../model.json";
import { Button } from "@chakra-ui/button";
import { Avatar } from "@chakra-ui/avatar";
import { useColorModeValue } from "@chakra-ui/color-mode";
import { Layout } from "../../../components/layout/Layout";

function ApproveShareContactInformation() {
  const [contract, setContract] = useState();
  const [requesters, setRequesters] = useState();
  const [accessRequests, setAccessRequests] = useState();
  const [mySelf, setMySelf] = useState();
  const [myPrivateProfile, setMyPrivateProfile] = useState();

  const init = async () => {
    const dRecruitV1Contract = await loadDRecruitV1Contract();
    setContract(dRecruitV1Contract);
    const { network } = await getNetwork();
    const addresses = await window.ethereum.enable();
    console.log(addresses);
    const self = await SelfID.authenticate({
      authProvider: new EthereumAuthProvider(window.ethereum, addresses[0]),
      ceramic: CERAMIC_TESTNET,
      connectNetwork: CERAMIC_TESTNET,
      model: modelAliases,
    });
    setMySelf(self);
    const privateProfile = await self.get("privateProfile");
    setMyPrivateProfile(privateProfile);
    const reqs = await dRecruitV1Contract.getRequesters(privateProfile.tokenId);
    console.log(reqs);
    setRequesters(reqs);
  };
  useEffect(() => {
    init();
  }, []);

  const handleApproval = useCallback(
    async requesterAddress => {
      const { network } = await getNetwork();
      const decrypted = await await mySelf.client.ceramic.did?.decryptDagJWE(JSON.parse(myPrivateProfile.encrypted));
      console.log({ decrypted });
      const core = ceramicCoreFactory();
      const recruiter = `${requesterAddress}@eip155:${network.chainId}`;
      console.log({ recruiter });
      const did = await core.getAccountDID(recruiter);
      console.log({ did });
      const newDagJWE = await mySelf.client.ceramic.did?.createDagJWE(decrypted, [
        // logged-in user,
        mySelf.id,
        did,
      ]);
      const tx = await contract.approveRequest(myPrivateProfile.tokenId, requesterAddress);
      const receipt = await tx.wait();
      console.log({ receipt });
      return mySelf.set("privateProfile", {
        ...myPrivateProfile,
        encrypted: JSON.stringify(newDagJWE),
      });
    },
    [mySelf, myPrivateProfile],
  );
  return (
    <Layout>
      {requesters && requesters.length > 0 ? (
        <SimpleGrid columns={4} spacing={10}>
          {requesters.map(requesterAddress => (
            <Center py={6} key={requesterAddress}>
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
                <Badge px={2} py={1} bg={useColorModeValue("gray.50", "gray.800")} fontWeight={"400"}>
                  {requesterAddress}
                </Badge>
                <Heading fontSize={"2xl"} fontFamily={"body"}>
                  Lindsey James
                </Heading>
                <Text fontWeight={600} color={"gray.500"} mb={4}>
                  @lindsey_jam3s
                </Text>
                <Text textAlign={"center"} color={useColorModeValue("gray.700", "gray.400")} px={3}>
                  Actress, musician, songwriter and artist. PM for work inquires or{" "}
                  <Link href={"#"} color={"blue.400"}>
                    #tag
                  </Link>{" "}
                  me in your posts
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
                    onClick={() => handleApproval(requesterAddress)}
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
