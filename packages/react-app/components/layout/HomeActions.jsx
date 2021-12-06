import { Button, HStack } from "@chakra-ui/react";
import { Flex, Heading } from "@chakra-ui/layout";
import { useRouter } from "next/dist/client/router";
import React from "react";

export const HomeActions = () => {
  const router = useRouter();
  return (
    <Flex flexDirection="column" justifyContent="center" alignItems="center" w="full">
      <Heading>Welcome to recruiter.party!</Heading>
      <HStack>
        <Button m="5" size="lg" colorScheme="purple" onClick={() => router.push("/profile/edit-profile")}>
          JOIN AS A BUILDER
        </Button>
        <Button m="5" size="lg" colorScheme="green" onClick={() => router.push("/profile/approval")}>
          APPROVE REQUESTS
        </Button>
      </HStack>
    </Flex>
  );
};
