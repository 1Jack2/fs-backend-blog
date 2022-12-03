const userRouter = require('express').Router()
const User = require('../models/user')
const bcrypt = require('bcrypt')

userRouter.get('/', async (request, response, next) => {
  const users = await User.find({})
  response.json(users)
})

userRouter.post('/', async (request, response) => {
  const {username, name, password} = request.body
  const saltRound = 10
  const passwordHash = await bcrypt.hash(password, saltRound)
  const user = new User({
    username,
    name,
    passwordHash
  })

  const savedUser = await user.save()
  response.status(201).json(savedUser)
})

// userRouter.delete('/:id', async (request, response) => {
//   await User.findByIdAndRemove(request.params.id)
//   response.status(204).end()
// })
//
// userRouter.put('/:id', async (request, response) => {
//   const updated = await User.findByIdAndUpdate(request.params.id, request.body, {new: true})
//   response.json(updated)
// })

module.exports = userRouter
