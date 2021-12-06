import React, { useContext, useEffect, useState } from "react";
import { useColorModeValue } from "@chakra-ui/color-mode";
import { Box, Flex, Stack, Heading, HStack, VStack } from "@chakra-ui/layout";
import {
  Avatar,
  Image,
  Button,
  Text,
  Tag,
  TagLabel,
  useToast,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  FormLabel,
  Input,
  Checkbox,
} from "@chakra-ui/react";
import { Icon, EmailIcon, PhoneIcon, LinkIcon } from "@chakra-ui/icons";
import { BsFillPersonLinesFill } from "react-icons/bs";
import { GrLocation } from "react-icons/gr";
import { ethers } from "ethers";
import axios from "axios";
import Blockies from "react-blockies";
import { NETWORKS } from "../../constants";

import { Web3Context } from "../../helpers/Web3Context";
import { useDebounce } from "../../hooks";

function MediaCard({
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
  primaryAction,
  privateProfile,
  dRecruitContract,
  tokenContract,
  tokenMetadata,
}) {
  const [decryptedData, setDecryptedData] = useState();
  const [canView, setCanView] = useState(false);
  const [stakeAmount, setStakeAmount] = useState();
  const debouncedStakeAmount = useDebounce(stakeAmount, 500);
  const [approvalState, setApprovalState] = useState(); // ENOUGH || NOT_ENOUGH || LOADING
  const [currAllowance, setCurrAllowance] = useState();
  const [unlimitedAllowanceWanted, setUnlimitedAllowanceWanted] = useState(true);
  const context = useContext(Web3Context);

  const toast = useToast();

  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
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

  const handleRequestPrivateProfileUnlock = async () => {
    if (!stakeAmount || +stakeAmount < +"0.1") {
      return toast({ title: "Please enter a valid stake amount. Minimum 0.1 tokens.", status: "error" });
    }
    const weiStakeAmount = ethers.utils.parseEther(stakeAmount);
    try {
      // Only ask for allowance if it is not enough
      if (approvalState === "NOT_ENOUGH") {
        const tx = await tokenContract.approve(
          dRecruitContract.address,
          unlimitedAllowanceWanted ? ethers.constants.MaxUint256.toString() : weiStakeAmount,
        );
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
        await tx.wait();
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
      }
      const tx = await dRecruitContract.request(privateProfile.tokenId, weiStakeAmount, {
        value: 0,
      });
      toast({
        title: "Request transaction sent",
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
      await tx.wait();
      toast({
        title: "Request transaction confirmed",
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
      onClose();
    } catch (err) {
      toast({
        title: "Request transaction failed",
        description: err.message + (err.data ? ` ${err.data.message}` : ""),
        status: "error",
      });
    }
    setStakeAmount();
    // const { data } = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/unlock/${privateProfile.tokenId}`, {
    //   withCredentials: true,
    // });
    // return data;
  };

  useEffect(() => {
    async function exec() {
      const weiStakeAmount = ethers.utils.parseEther(debouncedStakeAmount);
      const allowance = await tokenContract.allowance(context.address, dRecruitContract.address);
      if (allowance.lt(weiStakeAmount)) {
        setApprovalState("NOT_ENOUGH");
      } else {
        setApprovalState("ENOUGH");
      }
    }
    if (debouncedStakeAmount) {
      setApprovalState("LOADING");
      exec();
    }
  }, [isOpen, debouncedStakeAmount]);

  useEffect(() => {
    if (unlimitedAllowanceWanted) {
      setApprovalState("NOT_ENOUGH");
    }
  }, [unlimitedAllowanceWanted]);

  useEffect(() => {
    async function exec() {
      const allowance = await tokenContract.allowance(context.address, dRecruitContract.address);
      setCurrAllowance(allowance);
    }
    exec();
  }, [isOpen]);

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Request unlock information</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack justifyItems="left">
              <FormLabel htmlFor="stakeAmount">Enter stake amount in {tokenMetadata && tokenMetadata.symbol}</FormLabel>
              <Input
                value={stakeAmount}
                onChange={e => setStakeAmount(e.target.value)}
                placeholder="Minimum 0.1"
                borderColor="purple.500"
              />

              {currAllowance && currAllowance.lt(ethers.constants.MaxUint256) && (
                <HStack>
                  <Checkbox
                    defaultIsChecked
                    value={unlimitedAllowanceWanted}
                    onChange={e => setUnlimitedAllowanceWanted(e.target.checked)}
                  >
                    Approve with unlimited allowance?
                  </Checkbox>
                </HStack>
              )}
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button
              width="100%"
              colorScheme="blue"
              onClick={() => {
                handleRequestPrivateProfileUnlock();
              }}
              disabled={!approvalState || approvalState === "LOADING"}
              isLoading={approvalState === "LOADING"}
            >
              {!approvalState || approvalState === "LOADING"
                ? "Enter amount"
                : approvalState === "ENOUGH"
                ? "Confirm"
                : "Approve"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
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
              {heading || "Anonymous"}
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
          <Button
            disabled={canView}
            w={"full"}
            mt={8}
            // TODO: get dev main address
            onClick={onOpen}
          >
            {canView ? "✔️ Information already unlocked" : primaryAction}
          </Button>
        </Box>
      </Box>
    </>
  );
}

export default MediaCard;
