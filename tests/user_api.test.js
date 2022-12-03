const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const api = supertest(app)
const User = require('../models/user')
const helper = require('./test_helper')
const bcrypt = require('bcrypt')

describe('when there is initially one user in DB', () => {
  const initialUsername = 'john doe'

  beforeEach(async () => {
    await User.deleteMany({})
    const initialUser = new User({
      username: initialUsername,
      name: 'john doe',
      passwordHash: await bcrypt.hash('123456', 10)
    })
    await initialUser.save()
  })

  test('initially user is returned', async () => {
    const response = await api.get('/api/users')
      .expect(200)
      .expect('Content-Type', /application\/json/)
    const users = response.body
    expect(users).toHaveLength(1)
    expect(users[0].username).toEqual(initialUsername)
  })

  test('create success with a fresh username', async () => {
    const usersAtBegin = await helper.usersInDb()

    const newUser = {
      username: 'j3z',
      name: 'jack',
      password: '12345'
    }

    await api.post('/api/users/')
      .send(newUser)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd.length).toEqual(1 + usersAtBegin.length)

    expect(usersAtEnd.map((user) => user.username)).toContain(newUser.username)
  })
})
