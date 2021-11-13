const mongoose = require('mongoose')

const profileSchema = new mongoose.Schema({
  tokenId: {
    type: Number,
    unique: true,
    required: true
  },
  name: {
    type: String
  },
  description: {
    type: String
  },
  birthDate: {
    type: String
  },
  gender: {
    type: String
  },
  residenceCity: {
    type: String
  },
  residenceCountry: {
    type: String
  },
  nationalities: {
    type: [String]
  },
  affiliations: {
    type: [String]
  },
  education: {
    type: [String]
  },
  skills: {
    type: [String]
  },
  experience: {
    type: [String]
  }
})

const Profile = mongoose.model('Profile', profileSchema)

module.exports = { Profile }
