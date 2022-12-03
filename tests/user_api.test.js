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
})

describe('invalid user should not be saved', () => {
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

  const createUserFailed = async (newUser) => {
    const usersAtBegin = await helper.usersInDb()

    await api.post('/api/users/')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd.length).toEqual(usersAtBegin.length)
  }

  test('create failed without username', async () => {
    const userWithoutUsername = {
      name: 'jack',
      password: '12345'
    }
    await createUserFailed(userWithoutUsername)
  })

  test('create failed without password', async () => {
    const userWithoutPassword = {
      username: 'j3z',
      name: 'jack',
    }
    await createUserFailed(userWithoutPassword)
  })

  test('create failed with username too short', async () => {
    const usernameLessThan3 = {
      username: 'j3',
      name: 'jack',
      password: '12345'
    }
    await createUserFailed(usernameLessThan3)
  })

  test('create failed with password too short', async () => {
    const passwordLessThan3 = {
      username: 'j3z',
      name: 'jack',
      password: '12'
    }
    await createUserFailed(passwordLessThan3)
  })

  test('create failed with username not unique', async () => {
    const usernameNotUnique = {
      username: initialUsername,
      name: 'jack',
      password: '12345'
    }
    await createUserFailed(usernameNotUnique)
  })

  test('create success', async () => {
    const usersAtBegin = await helper.usersInDb()
    const validUser = {
      username: 'j333z',
      name: 'jack3',
      password: '12345'
    }

    await api.post('/api/users/')
      .send(validUser)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd.length).toEqual(1 + usersAtBegin.length)

    expect(usersAtEnd.map((user) => user.username)).toContain(validUser.username)
  })

})
