const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const api = supertest(app)
const Blog = require('../models/blog')
const helper = require('./test_helper')

beforeEach(async () => {
  await Blog.deleteMany({})
  console.log('cleared')

  let blogObjs = helper.initialBlogs.map(blog => new Blog(blog))
  const promisArray = blogObjs.map(blog => blog.save())
  await Promise.all(promisArray)

  console.log('done')
})

test('blogs are returned as json', async () => {
  await api
    .get('/api/blogs')
    .expect(200)
    .expect('Content-Type', /application\/json/)
})

test('all blogs are returned', async () => {
  const response = await api.get('/api/blogs')

  expect(response.body).toHaveLength(helper.initialBlogs.length)
})

test('a specific blog is within the returned blogs', async () => {
  const response = await api.get('/api/blogs')

  const url = response.body.map(r => r.url)
  expect(url).toContain('https://reactpatterns.com/')
})

test('a valid blog can be added', async () => {
  const newBlog = {
    title: 'Go To Statement Considered Harmful',
    author: 'Edsger W. Dijkstra',
    url: 'http://www.u.arizona.edu/~rubinson/copyright_violations/Go_To_Considered_Harmful.html',
    likes: 5,
  }

  await api
    .post('/api/blogs')
    .send(newBlog)
    .expect(201)
    .expect('Content-Type', /application\/json/)

  const blogAtEnd = await helper.blogsInDb()
  expect(blogAtEnd).toHaveLength(helper.initialBlogs.length + 1)

  const urls = blogAtEnd.map(r => r.url)
  expect(urls).toContain(
    'http://www.u.arizona.edu/~rubinson/copyright_violations/Go_To_Considered_Harmful.html'
  )
})


test('blog without title or url is not added', async () => {
  const blogWithoutTitle = {
    author: 'Robert C. Martin',
    url: 'http://www.u.arizona.edu/~rubinson/copyright_violations/Go_To_Considered_Harmful.html',
    likes: 10,
  }

  const blogWithoutUrl = {
    title: 'First class tests',
    author: 'Robert C. Martin',
    likes: 10,
  }

  await api.post('/api/blogs')
    .send(blogWithoutTitle)
    .expect(400)
    .expect('Content-Type', /application\/json/)

  await api.post('/api/blogs')
    .send(blogWithoutUrl)
    .expect(400)
    .expect('Content-Type', /application\/json/)
})

test('blog use id, not _id', async () => {
  const blogs = await helper.blogsInDb()
  blogs.forEach((blog) => {
    expect(blog.id).toBeDefined()
    expect(blog._id).not.toBeDefined()
  })
})

test('default likes number is 0', async () => {
  const newBlog = {
    title: 'First class tests',
    author: 'Robert C. Martin',
    url: 'http://www.u.arizona.edu/~rubinson/copyright_violations/Go_To_Considered_Harmful.html',
  }

  const response = await api.post('/api/blogs')
    .send(newBlog)
    .expect(201)
    .expect('Content-Type', /application\/json/)
  expect(response.body.likes).toBe(0)
})

test('a blog can be delete', async () => {
  const initialBlogs = await helper.blogsInDb()
  await api.delete(`/api/blogs/${initialBlogs[0].id}`)
    .send()
    .expect(204)
  const blogsAfterDel = await helper.blogsInDb()
  blogsAfterDel.forEach(blog => {
    expect(blog.id).not.toEqual(initialBlogs[0].id)
  })
})

test('a blog\'s likes can be updated', async () => {
  const initialBlogs = await helper.blogsInDb()
  const toUpdate = {id: initialBlogs[0].id, likes: -1}
  const blogReturned = await api.put(`/api/blogs/${toUpdate.id}`)
    .send(toUpdate)
    .expect(200)

  expect(blogReturned.body.likes).toEqual(toUpdate.likes)

  const blogsUpdated = await helper.blogsInDb()
  let flag = false
  blogsUpdated.forEach(blog => {
    const blogToView = JSON.parse(JSON.stringify(blog))
    if (blogToView.id === toUpdate.id) {
      flag = true
      expect(blogToView.likes).toEqual(toUpdate.likes)
    }
  })
  expect(flag).toEqual(true)
})

afterAll(() => {
  mongoose.connection.close()
})
