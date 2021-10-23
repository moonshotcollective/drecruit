const mongoose = require('mongoose')

const infoSchema = new mongoose.Schema({
  tokenId: {
    type: String,
    required: true
  },
  contentId: {
    type: String,
    required: true
  }
})

const Info = mongoose.model('Info', infoSchema)

module.exports = { Info }
