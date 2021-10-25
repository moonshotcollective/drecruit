const PrivateProfileSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "PrivateProfile",
  type: "object",
  properties: {
    tokenId: {
      type: "integer",
      title: "tokenId",
    },
    tokenURI: {
      type: "string",
      title: "tokenURI",
    },
    encrypted: {
      type: "string",
      title: "encrypted",
    },
  },
};
module.exports = {
  privateProfile: PrivateProfileSchema,
};
