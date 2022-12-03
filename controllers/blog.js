const blogRouter = require('express').Router()
const Blog = require('../models/blog')
const User = require('../models/user')
const jwt = require('jsonwebtoken')
const logger = require('../utils/logger')
const userExtractor = require('../utils/middleware').userExtractor

blogRouter.get('/', async (request, response, next) => {
  const blogs = await Blog.find({})
  response.json(blogs)
})

blogRouter.post('/', userExtractor, async (request, response) => {
  const body = request.body
  const user = request.user
  const blog = new Blog({
    title: body.title,
    author: body.author,
    url: body.url,
    likes: body.likes,
    user: user
  })

  const savedBlog = await blog.save()

  user.blogs = user.blogs.concat(savedBlog._id)
  await user.save()

  response.status(201).json(savedBlog)
})

blogRouter.delete('/:id', userExtractor, async (request, response) => {
  const blog = await Blog.findById(request.params.id)
  if (!blog) {
    response.status(404).end()
    return
  }
  if (blog.user.toString() !== request.user.id) {
    response.status(401).json({error: 'permission denied'})
    return
  }
  await Blog.findByIdAndRemove(request.params.id)
  response.status(204).end()
})

blogRouter.put('/:id', userExtractor, async (request, response) => {
  const updated = await Blog.findByIdAndUpdate(request.params.id, request.body, {new: true})
  response.json(updated)
})

module.exports = blogRouter
