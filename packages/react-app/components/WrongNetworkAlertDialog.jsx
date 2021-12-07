import React, { useContext, useEffect, useState } from "react";
import {
  Button,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
} from "@chakra-ui/react";

import { Web3Context } from "../helpers/Web3Context";

function WrongNetworkAlertDialog() {
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const context = useContext(Web3Context);
  const cancelRef = React.useRef();

  useEffect(() => {
    if (context) {
      setIsAlertOpen(!context.rightNetwork);
    }
  }, [context && context.rightNetwork]);

  const onNetworkSwitch = async () => {
    const data = [
      {
        chainId: "0x" + context.targetNetwork.chainId.toString(16),
        chainName: context.targetNetwork.name,
        nativeCurrency: context.targetNetwork.nativeCurrency,
        rpcUrls: [context.targetNetwork.rpcUrl],
        blockExplorerUrls: [context.targetNetwork.blockExplorer],
      },
    ];
    try {
      await ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: data[0].chainId }],
      });
      setIsAlertOpen(false);
    } catch (switchError) {
      // This error code indicates that the chain has not been added to MetaMask.
      if (switchError.code === 4902) {
        try {
          await ethereum.request({
            method: "wallet_addEthereumChain",
            params: data,
          });
          setIsAlertOpen(false);
        } catch (addError) {
          console.log(addError);
        }
      }
      // handle other "switch" errors
    }
  };

  return (
    <AlertDialog isOpen={isAlertOpen} leastDestructiveRef={cancelRef}>
      <AlertDialogOverlay>
        <AlertDialogContent>
          <AlertDialogHeader fontSize="lg" fontWeight="bold">
            Switch network
          </AlertDialogHeader>

          <AlertDialogBody>
            To use this app you must switch to the {context.targetNetwork.name} network.
          </AlertDialogBody>

          <AlertDialogFooter>
            <Button
              ref={cancelRef}
              style={{ marginRight: 20 }}
              onClick={() => {
                setIsAlertOpen(false);
              }}
            >
              Close
            </Button>
            <Button onClick={onNetworkSwitch} colorScheme="blue">
              Switch
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogOverlay>
    </AlertDialog>
  );
}

export default WrongNetworkAlertDialog;
