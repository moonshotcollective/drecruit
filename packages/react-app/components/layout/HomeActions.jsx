import { Button } from "@chakra-ui/button";
import { Box, Heading } from "@chakra-ui/layout";
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
    <Box>
      <Heading>Join dRecruit as:</Heading>
      <Button m="5" onClick={handleJoinAsRecruiter}>
        RECRUITER
      </Button>
      <Button m="5" onClick={handleJoinAsDeveloper}>
        DEVELOPER
      </Button>
    </Box>
  );
};
