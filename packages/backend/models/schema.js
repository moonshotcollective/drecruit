const mongoose = require('mongoose')

const authSchema = new mongoose.Schema({
  message: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date, expires: 600, default: Date.now
  }
})

const Auth = mongoose.model('Auth', authSchema)

module.exports = { Auth }
