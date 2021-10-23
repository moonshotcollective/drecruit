const mongoose = require('mongoose')

const resumeSchema = new mongoose.Schema({
  bio: {
    type: Array
  },
  experience: {
    type: Array
  },
  education: {
    type: Array
  },
  skills: {
    type: Array
  },
  languages: {
    type: Array
  }
})

const Resume = mongoose.model('Resume', resumeSchema)

module.exports = { Resume }
