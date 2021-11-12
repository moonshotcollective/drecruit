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

const PublicProfileSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "PublicProfile",
  type: "object",
  properties: {
    skillTags: {
      title: "SkillTagsList",
      type: "array",
      items: {
        type: "string",
      },
    },
    experiences: {
      title: "ExperienceList",
      type: "array",
      items: {
        type: "string",
      },
    },
  },
};

module.exports = {
  privateProfile: PrivateProfileSchema,
  publicProfile: PublicProfileSchema,
};
