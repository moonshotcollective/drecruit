require('dotenv').config()
const { ethers } = require('ethers')
const DRecruitAbi = require('../config/DRecruitAbi.json')

const rpcProvider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL)
const dRecruitContract = new ethers.Contract(
  process.env.CONTRACT_ADDRESS,
  DRecruitAbi,
  rpcProvider
)

module.exports = { dRecruitContract }
