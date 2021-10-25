import Web3Modal from "web3modal";
import { ethers } from "ethers";
import DRecruiter from "../contracts/hardhat_contracts.json";

export { default as Transactor } from "./Transactor";

export const getNetwork = async () => {
  const web3Modal = new Web3Modal();
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
