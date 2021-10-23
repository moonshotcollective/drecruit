const PrivateProfileSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "PrivateProfile",
  type: "object",
  properties: {
    encrypted: {
      type: "string",
      title: "encrypted",
    },
  },
};
module.exports = {
  privateProfile: PrivateProfileSchema,
};
