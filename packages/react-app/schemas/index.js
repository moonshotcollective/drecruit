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

const TagsSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "TagsList",
  type: "array",
  items: {
    type: "string",
    title: "TagItem",
  },
};
module.exports = {
  privateProfile: PrivateProfileSchema,
  tags: TagsSchema,
};
