import React, { useContext, useEffect, useState } from "react";
import { HStack, VStack } from "@chakra-ui/layout";
import {
  Button,
  Text,
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
import { LinkIcon } from "@chakra-ui/icons";
import { useDebounce } from "../hooks";
import { ethers } from "ethers";
import Blockies from "react-blockies";
import { NETWORKS } from "../constants";
import { Web3Context } from "../helpers/Web3Context";

function UnlockProfile({ canView, dRecruitContract, tokenContract, privateProfile, tokenMetadata }) {
  const context = useContext(Web3Context);
  const [stakeAmount, setStakeAmount] = useState();
  const [unlimitedAllowanceWanted, setUnlimitedAllowanceWanted] = useState(true);
  const [currAllowance, setCurrAllowance] = useState();
  const [approvalState, setApprovalState] = useState(); // ENOUGH || NOT_ENOUGH || LOADING
  const debouncedStakeAmount = useDebounce(stakeAmount, 500);
  const toast = useToast();

  const { isOpen, onOpen, onClose } = useDisclosure();

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
      console.log("weiStakeAmount", weiStakeAmount);
      console.log("weiStakeAmountS", weiStakeAmount.toString());
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
      const receipt = await tx.wait();
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
                  <FormLabel htmlFor="unlimitedAllowanceWanted">Approve unlimited allowance?</FormLabel>
                  <Checkbox
                    value={unlimitedAllowanceWanted}
                    onChange={e => setUnlimitedAllowanceWanted(e.target.checked)}
                  />
                </HStack>
              )}
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button
              marginLeft={0}
              marginRight={"auto"}
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
      <Button
        disabled={canView}
        w={"full"}
        mt={8}
        // TODO: get dev main address
        onClick={onOpen}
      >
        {canView ? "✔️ Information already unlocked" : "Request contact information"}
      </Button>
    </>
  );
}

export default UnlockProfile;
