const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const api = supertest(app)
const User = require('../models/user')
const Blog = require('../models/blog')
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

    await Blog.deleteMany({})
  })

  test('initially user is returned', async () => {
    const response = await api.get('/api/users')
      .expect(200)
      .expect('Content-Type', /application\/json/)
    const users = response.body
    expect(users).toHaveLength(1)
    expect(users[0].username).toEqual(initialUsername)
  })

  test('blog and user are sync after adding new blog', async () => {
    const usersAtBegin = await helper.usersInDb()
    const userAtBegin = usersAtBegin[0]
    const blogsAtBegin = await helper.blogsInDb()

    const newBlog = {
      title: 'Go To Statement Considered Harmful',
      author: 'Edsger W. Dijkstra',
      url: 'http://www.u.arizona.edu/~rubinson/copyright_violations/Go_To_Considered_Harmful.html',
      likes: 5,
      userId: userAtBegin.id
    }

    const blogRes = await api
      .post('/api/blogs')
      .send(newBlog)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    // add a blog
    const blogsAtEnd = await helper.blogsInDb()
    expect(blogsAtEnd).toHaveLength(blogsAtBegin.length + 1)

    // new blog have userId
    const userIds = blogsAtEnd.map(blog => blog.user.toString())
    expect(userIds).toContain(userAtBegin.id)

    // user have blogs
    const userRes = await api.get(`/api/users/${userAtBegin.id}`)
    const userBlogs = userRes.body.blogs
    expect(userBlogs.map(blog => blog.id))
      .toContain(blogRes.body.id)
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



afterAll(() => {
  mongoose.connection.close()
})
