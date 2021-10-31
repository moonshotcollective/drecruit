import { ethers } from "ethers";
import DRecruiter from "../contracts/hardhat_contracts.json";

export { default as Transactor } from "./Transactor";

export const loadDRecruitV1Contract = async (targetNetwork, signer) => {
  const contract = new ethers.Contract(
    DRecruiter[targetNetwork.chainId][targetNetwork.name].contracts.DRecruitV1.address,
    DRecruiter[targetNetwork.chainId][targetNetwork.name].contracts.DRecruitV1.abi,
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
