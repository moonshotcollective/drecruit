import { Button } from "@chakra-ui/react";
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
  const handleJoinAsDeveloper = () => {
    return router.push("/profile/edit-profile");
  };
  return (
    <Flex flexDirection="column" justifyContent="center" alignItems="center" w="full">
      <Heading>Welcome to dRecruit!</Heading>
      <Button m="5" size="lg" colorScheme="purple" onClick={handleJoinAsDeveloper}>
        JOIN AS A BUILDER
      </Button>
    </Flex>
  );
};
