
require('dotenv').config()
const hre = require('hardhat')

async function main () {
  const DRecruit = await hre.ethers.getContractFactory('DRecruitV1')
  const dRecruit = await DRecruit.deploy()
  await dRecruit.deployTransaction.wait()
  console.log('DRecruit deployed to:', dRecruit.address)
  const fee = hre.ethers.utils.parseUnits("0.01", "ether")
  await dRecruit.initialize(fee, '0xfe4f5145f6e09952a5ba9e956ed0c25e3fa4c7f1')
  console.log('Contract initialized', dRecruit.address)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
