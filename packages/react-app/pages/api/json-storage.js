// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { NextApiRequest, NextApiResponse } from "next";
import multiparty from "multiparty";
import { Web3Storage, File, Blob } from "web3.storage";
import * as fs from "fs";

function getWeb3Token() {
  const token = process.env.WEB3STORAGE_TOKEN;
  if (!token) throw new Error(`Misconfigured: web3.storage token`);
  return token;
}

const web3Storage = new Web3Storage({ token: getWeb3Token() });

async function handler(req, res) {
  const { did } = JSON.parse(req.body);
  if (did) {
    const fileName = `${did}.json`;
    const blob = new Blob([JSON.stringify({ did })], { type: "application/json" });
    const file = new File([blob], fileName);
    const cid = await web3Storage.put([file]);
    return res.status(200).json({ cid, fileName });
  }
  return res.status(400);
}

// first we need to disable the default body parser
export const config = {
  api: {
    bodyParser: true,
  },
};
export default handler;
