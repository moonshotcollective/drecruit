import React, { useCallback, useEffect, useState } from "react";
import { useColorModeValue } from "@chakra-ui/color-mode";
import { Box, Flex, Stack, Heading, Code, HStack } from "@chakra-ui/layout";
import {
  Avatar,
  Popover,
  PopoverTrigger,
  Image,
  Button,
  Text,
  PopoverContent,
  PopoverArrow,
  PopoverCloseButton,
  PopoverHeader,
} from "@chakra-ui/react";
import { Icon, EmailIcon, InfoIcon, PhoneIcon } from "@chakra-ui/icons";
import { BsFillPersonLinesFill } from "react-icons/bs";
import { GrLocation } from "react-icons/gr";

function MediaCard({
  avatarSrc,
  coverSrc,
  description,
  heading,
  subheading,
  date,
  twitter,
  hasWebAccount,
  github,
  primaryActionOnClick,
  primaryAction,
  secondaryActionOnClick,
  secondaryAction,
  privateProfile,
  self,
}) {
  const [decryptedData, setDecryptedData] = useState();
  const [canView, setCanView] = useState(false);

  useEffect(() => {
    let isValidRecipient = false;
    (async () => {
      try {
        const decrypted = await self.client.ceramic.did.decryptDagJWE(privateProfile);
        setCanView(true);
        setDecryptedData(decrypted);
      } catch (error) {
        setCanView(false);
      }
    })();
  }, [privateProfile]);

  const handleSecondaryAction = useCallback(async () => {
    const decryptedData = await secondaryActionOnClick(privateProfile);
    console.log({ decryptedData });
    setDecryptedData(decryptedData);
    return decryptedData;
  }, [privateProfile]);

  return (
    <Box
      maxW={"350px"}
      w={"full"}
      bg={useColorModeValue("white", "gray.800")}
      boxShadow={"2xl"}
      rounded={"3xl"}
      overflow={"hidden"}
      my="5"
    >
      <Image alt="cover" h={"120px"} w={"full"} src={coverSrc} objectFit="cover" />
      <Flex justify={"center"} mt={-12}>
        <Avatar
          size={"xl"}
          src={avatarSrc}
          alt={"Author"}
          css={{
            border: "2px solid white",
          }}
        />
      </Flex>
      <Box p={6}>
        <Stack spacing={0} align="left" mb={5}>
          <Heading fontSize={"2xl"} fontWeight={600} fontFamily={"body"}>
            {heading || "No Name"}
          </Heading>
          <Heading fontSize={"lg"} fontWeight={500} fontFamily={"body"}>
            {description || "No Description"}
          </Heading>
          <Text color={"gray.500"}>{subheading}</Text>
          <Text color={"gray.500"}>{date}</Text>
        </Stack>
        {hasWebAccount && (
          <Stack direction={"row"} justify={"center"} spacing={6}>
            <Stack spacing={0} align={"center"}>
              <div>Twitter Icon</div>
              <Text fontSize={"sm"} color={"gray.500"}>
                {twitter}
              </Text>
            </Stack>
            <Stack spacing={0} align={"center"}>
              <div>Github Icon</div>
              <Text fontSize={"sm"} color={"gray.500"}>
                {github}
              </Text>
            </Stack>
          </Stack>
        )}
        {decryptedData ? (
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
                <Text fontWeight="bold" color={"gray.500"}>
                  {decryptedData.physicalAddress}
                </Text>
              </HStack>
            </Stack>
          </Box>
        ) : (
          <Box>
            <Text>{privateProfile.ciphertext}</Text>
          </Box>
        )}
        <Button disabled={canView} w={"full"} mt={8} onClick={primaryActionOnClick}>
          {canView ? "✔️ Informations already unlocked" : primaryAction}
        </Button>
      </Box>
    </Box>
  );
}

export default MediaCard;
