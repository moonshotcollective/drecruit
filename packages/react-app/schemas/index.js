const SimpleNoteSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "SimpleNote",
  type: "object",
  properties: {
    text: {
      type: "string",
      title: "text",
      maxLength: 4000,
    },
  },
};
module.exports = {
  note: SimpleNoteSchema,
};
