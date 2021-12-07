import { Button, HStack } from "@chakra-ui/react";
import { Box, Flex, Heading } from "@chakra-ui/layout";
import { ethers } from "ethers";
import { useRouter } from "next/dist/client/router";
import React from "react";

export const HomeActions = ({ contract, mySelf }) => {
  const router = useRouter();
  const handleJoinAsRecruiter = async () => {
    const tx = await contract.joinDrecruiterAsRecruiter(mySelf.id, {
      value: ethers.utils.parseEther("0.1"),
    });
    const receipt = await tx.wait();
    console.log({ receipt });
  };
  const handleRouteChange = () => {
    return router.push();
  };
  return (
    <Flex flexDirection="column" justifyContent="center" alignItems="center" w="full">
      <Heading>Welcome to recruiter.party!</Heading>
      <HStack>
        <Button m="5" size="md" colorScheme="purple" onClick={() => router.push("/profile/edit-profile")}>
          JOIN AS A BUILDER
        </Button>
        <Button m="5" size="md" colorScheme="green" onClick={() => router.push("/profile/approval")}>
          APPROVE REQUESTS
        </Button>
      </HStack>
    </Flex>
  );
};
