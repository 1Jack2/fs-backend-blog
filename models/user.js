const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    minlength: 3,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  blogs: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Blog'
    }
  ]
})

const User = mongoose.model('User', userSchema)

userSchema.set('toJSON', {
  transform: (document, returnObject) => {
    returnObject.id = returnObject._id.toString()
    delete returnObject._id
    delete returnObject.__v
    delete returnObject.passwordHash
  }
})

module.exports = mongoose.model('User', userSchema)
