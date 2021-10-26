import Web3Modal from "web3modal";
import { ethers } from "ethers";
import DRecruiter from "../contracts/hardhat_contracts.json";
import WalletConnectProvider from "@walletconnect/web3-provider";
import Portis from "@portis/web3";
import Fortmatic from "fortmatic";
import Authereum from "authereum";
import WalletLink from "walletlink";

export { default as Transactor } from "./Transactor";

export const getNetwork = async () => {
  // Coinbase walletLink init
  const walletLink = new WalletLink({
    appName: "coinbase",
  });

  // WalletLink provider
  const walletLinkProvider = walletLink.makeWeb3Provider(`https://mainnet.infura.io/v3/${process.env.INFURA_ID}`, 1);

  const web3Modal = new Web3Modal({
    network: "mainnet", // Optional. If using WalletConnect on xDai, change network to "xdai" and add RPC info below for xDai chain.
    cacheProvider: true, // optional
    theme: "light", // optional. Change to "dark" for a dark theme.
    providerOptions: {
      walletconnect: {
        package: WalletConnectProvider, // required
        options: {
          bridge: "https://polygon.bridge.walletconnect.org",
          infuraId: process.env.INFURA_ID,
          rpc: {
            1: `https://mainnet.infura.io/v3/${process.env.INFURA_ID}`, // mainnet // For more WalletConnect providers: https://docs.walletconnect.org/quick-start/dapps/web3-provider#required
            42: `https://kovan.infura.io/v3/${process.env.INFURA_ID}`,
            100: "https://dai.poa.network", // xDai
          },
        },
      },
      portis: {
        display: {
          logo: "https://user-images.githubusercontent.com/9419140/128913641-d025bc0c-e059-42de-a57b-422f196867ce.png",
          name: "Portis",
          description: "Connect to Portis App",
        },
        package: Portis,
        options: {
          id: "6255fb2b-58c8-433b-a2c9-62098c05ddc9",
        },
      },
      fortmatic: {
        package: Fortmatic, // required
        options: {
          key: "pk_live_5A7C91B2FC585A17", // required
        },
      },
      // torus: {
      //   package: Torus,
      //   options: {
      //     networkParams: {
      //       host: "https://localhost:8545", // optional
      //       chainId: 1337, // optional
      //       networkId: 1337 // optional
      //     },
      //     config: {
      //       buildEnv: "development" // optional
      //     },
      //   },
      // },
      "custom-walletlink": {
        display: {
          logo: "https://play-lh.googleusercontent.com/PjoJoG27miSglVBXoXrxBSLveV6e3EeBPpNY55aiUUBM9Q1RCETKCOqdOkX2ZydqVf0",
          name: "Coinbase",
          description: "Connect to Coinbase Wallet (not Coinbase App)",
        },
        package: walletLinkProvider,
        connector: async (provider, _options) => {
          await provider.enable();
          return provider;
        },
      },
      authereum: {
        package: Authereum, // required
      },
    },
  });

  const connection = await web3Modal.connect();
  const provider = new ethers.providers.Web3Provider(connection);
  const signer = provider.getSigner();
  let network = await provider.getNetwork();
  console.log(network);
  if (network.chainId === 31337 || network.chainId === 1337) {
    network = { name: "localhost", chainId: 31337 };
  }
  if (network.name === "homestead") {
    network = { name: "mainnet", chainId: 1 };
  }
  return { network, signer, provider };
};

export const loadDRecruitV1Contract = async () => {
  const { network, signer } = await getNetwork();
  const contract = new ethers.Contract(
    DRecruiter[network.chainId][network.name].contracts.DRecruitV1.address,
    DRecruiter[network.chainId][network.name].contracts.DRecruitV1.abi,
    signer,
  );
  return contract;
};

export const getDidFromTokenURI = tokenURI => {
  const [ipfsWithColon, _, cid, didFilename] = tokenURI.split("/");
  const [did] = didFilename.split(".json");
  return {
    did,
    cid,
    tokenURI,
    filename: didFilename,
  };
};
