import React, { useCallback, useContext, useEffect, useState } from "react";
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
  Tag,
  TagLabel,
  SimpleGrid,
} from "@chakra-ui/react";
import { Icon, EmailIcon, InfoIcon, PhoneIcon, LinkIcon } from "@chakra-ui/icons";
import { BsFillPersonLinesFill } from "react-icons/bs";
import { GrLocation } from "react-icons/gr";
import { ethers } from "ethers";
import axios from "axios";
import Blockies from "react-blockies";
import { useRouter } from "next/dist/client/router";
import UnlockProfile from "../UnlockProfile";

import { Web3Context } from "../../helpers/Web3Context";

function MediaCard({
  did,
  account,
  avatarSrc,
  coverSrc,
  description,
  heading,
  subheading,
  publicProfile,
  date,
  twitter,
  hasWebAccount,
  github,
  privateProfile,
  dRecruitContract,
  tokenContract,
  tokenMetadata,
}) {
  const [decryptedData, setDecryptedData] = useState();
  const [canView, setCanView] = useState(false);
  const context = useContext(Web3Context);
  const router = useRouter();

  useEffect(() => {
    let isValidRecipient = false;
    (async () => {
      try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/unlock/${privateProfile.tokenId}`, {
          withCredentials: true,
        });
        console.log({ response });
        if (response.status !== 200) {
          return setCanView(false);
        }
        setCanView(true);
        setDecryptedData(response.data.decryptedProfile);
      } catch (error) {
        setCanView(false);
      }
    })();
  }, [privateProfile]);

  return (
    <>
      <Box
        maxW={"350px"}
        w={"full"}
        bg={useColorModeValue("white", "gray.800")}
        boxShadow={"2xl"}
        rounded={"3xl"}
        overflow={"hidden"}
        my="5"
      >
        <Image
          alt="cover"
          h={"120px"}
          w={"full"}
          src={
            coverSrc ||
            "https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=774&q=80"
          }
          objectFit="cover"
        />
        <Flex justify={"center"} mt={-12}>
          {avatarSrc ? (
            <Avatar
              size={"xl"}
              src={avatarSrc}
              alt={"Author"}
              css={{
                border: "2px solid white",
              }}
            />
          ) : (
            <Blockies size={10} seed={account.toLowerCase()} className="blockies" scale={10} />
          )}
        </Flex>
        <Box p={6}>
          <Stack spacing={0} align="left" mb={5}>
            <Heading fontSize={"2xl"} fontWeight={600} fontFamily={"body"}>
              <a href="#" onClick={() => router.push("/profile/" + did)}>
                {heading || "Anonymous"}
              </a>
            </Heading>
            <Heading fontSize={"lg"} fontWeight={500} fontFamily={"body"}>
              {description}
            </Heading>
            <Text color={"gray.500"}>{subheading}</Text>
            <Text color={"gray.500"}>{date}</Text>
          </Stack>
          {publicProfile.skillTags && (
            <HStack spacing={4}>
              {publicProfile.skillTags.map(skill => (
                <Tag size="md" key={skill} colorScheme="cyan">
                  <TagLabel alt={skill}>{skill}</TagLabel>
                </Tag>
              ))}
            </HStack>
          )}
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
            tokenMetadata={tokenMetadata}
          />
        </Box>
      </Box>
    </>
  );
}

export default MediaCard;
