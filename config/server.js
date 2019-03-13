// Server config for express and its modules.

const express = require('express')
const bodyParser = require('body-parser')
const plugins = require('./plugins')
const security = require('./security')
const HTTPErrors = require('../lib/HTTPErrors')
const apiConfig = require('./apiconfig')

const http = require('http')
const app = express()
const server = http.createServer(app)
const webSocket = require('socket.io')(server, {
  path: '/events'
})

/**
 * Set-up for express.
 */
const createApp = () => {
  // By default, responses are in JSON. Only supported content-type as of now.
  app.use((req, res, next) => {
    res
      .type(apiConfig.contentType)
      .set('X-Content-Type-Options', apiConfig.contentTypeOptions)
      .set('Cache-Control', apiConfig.cacheDefault)

    next()
  })

  app.use(bodyParser.urlencoded({ extended: true }))
  app.use(bodyParser.json())

  app.use(plugins.helmetConfig)

  // Github Landing Pads are unprotected by our JWT & Restful safety measures
  app.use('/hooks', require('../routes/hooks'))
  app.use('/authenticate', require('../routes/authenticate'))

  // API Routes are protected
  app.use(security.requestVerifiction)
  app.use(security.serviceTokenVerification)

  app.use('/token', require('../routes/token'))
  app.use('/', require('../routes/github'))

  // Invalid route / Error
  app.use((req, res, next) => next(new HTTPErrors.NotFoundError()))
  app.use((err, req, res, next) => translateError(err, req, res))

  return app
}

const translateError = (err, req, res) => {
  // Errors use a special envelope.
  const outputEnvelope = {
    code: 500,
    message: 'An unknown error has occured. Please try again later.',
    links: [
      { rel: 'self', method: req.method, href: req.originalUrl }
    ]
  }

  if (err instanceof HTTPErrors.GenericApplicationError || err instanceof SyntaxError) {
    switch (true) {
      case err instanceof SyntaxError:
        outputEnvelope.code = err.statusCode
        outputEnvelope.message = 'Invalid JSON provided. Please check your input and try again.'
        break
      case err instanceof HTTPErrors.NotFoundError:
        outputEnvelope.code = err.code
        outputEnvelope.message = err.message || 'Resource Could Not Be Found'
        break
      default:
        outputEnvelope.code = err.code || 500
        outputEnvelope.message = err.message || `Error ${err.code || 500} - ${err.constructor.name}`
    }
  }

  console.log(err)
  res.status(outputEnvelope.code).send(JSON.stringify(outputEnvelope))
}

/**
 * Set-up for socket.io.
*/
const createSocket = () => {
  webSocket.on('connection', client => {
    // This is any random client. They need to authenticate with a special event.
    console.log(`${client.handshake.headers['x-real-ip']} connected.`)

    client.on('authenticate', data => {
      // If they provide a valid jwt, we add them to a room that grants them access to github events.
      if ((client.token = security.socketTokenVerification(data.authorization))) {
        console.log(`${client.handshake.headers['x-real-ip']} authorized as: ${JSON.stringify(client.token)}`)
        client.join('listeners')
      } else {
        console.log(`${client.handshake.headers['x-real-ip']} attempted to authorize with an invalid jwt.`)
      }
    })

    client.on('disconnect', () => console.log(`${client.handshake.headers['x-real-ip']} disconnected.`))
  })
}

/**
 * Set-up for server and socket.
*/
const createServer = () => {
  createApp()
  createSocket()
  return server
}

module.exports = {
  createServer: createServer,
  refs: {
    server: server,
    webSocket: webSocket
  }
}
