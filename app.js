const express = require('express')
require('express-async-errors')
const app = express()
const cors = require('cors')
const mongoose = require('mongoose')
const logger = require('./utils/logger')
const config = require('./utils/config')
const blogRouter = require('./controllers/blog')
const userRouter = require('./controllers/user')
const loginRouter = require('./controllers/login')
const middleWire = require('./utils/middleware')

const url = config.MONGODB_URI
logger.info('connecting to', url)
mongoose.connect(url).then(() => {
  logger.info('connected to MongoDB')
}).catch(error => {
  logger.error('error connecting to MongoDB:', error.message)
})

app.use(cors())
app.use(express.json())

app.use('/api/login', loginRouter)
app.use('/api/blogs', blogRouter)
app.use('/api/users', userRouter)
app.use(middleWire.unknownEndpoint)
app.use(middleWire.errorHandler)

module.exports = app
