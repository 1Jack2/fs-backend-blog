const blogRouter = require('express').Router()
const Blog = require('../models/blog')
const {error} = require('../utils/logger')

blogRouter.get('/', async (request, response, next) => {
  const blogs = await Blog .find({})
  response.json(blogs)
})

blogRouter.post('/', async (request, response) => {
  const blog = new Blog(request.body)

  const savedBlog = await blog.save()
  response.status(201).json(savedBlog)
})

module.exports = blogRouter
