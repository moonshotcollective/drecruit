const { dRecruitContract } = require('../helpers/contract')
const { Profile } = require('../models')

const updateProfiles = async () => {
  const lastTokenIdDb = await Profile.find({}, { _id: 0, tokenId: 1 }, { $sort: { tokenId: 1 }, limit: 1 })
  const lastTokenId = await dRecruitContract.tokenId()
  for (let i = lastTokenIdDb + 1; i < lastTokenId; i++) {
    const tokenUri = dRecruitContract.uri(i)
    // Fetch from IPFS
    // await Profile.create(...)
  }
}

module.exports = { updateProfiles }
