const PrivateProfileSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "PrivateEmail",
  type: "object",
  properties: {
    email: {
      type: "string",
      title: "email",
    },
    phone: {
      type: "string",
      title: "phone",
    },
  },
};
module.exports = {
  privateProfile: PrivateProfileSchema,
};
