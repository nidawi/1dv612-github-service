const express = require('express')
const controller = require('../controller/AuthenticationController')
const router = express.Router()

router.route('/')
  .get(async (req, res, next) => {
    // Github has sent a response.
    try {
      const accessToken = await controller.finalizeAuthentication(req.query.code, req.query.state)
      console.log(`User Successfully Authenticated: ${accessToken}`)
      // notify API gateway of success
      await controller.notifyAPIGateway(accessToken, req.query.state)

      res.status(200).type('text').send('Authentication successful. You may now close this window.')
    } catch (err) { next(err) }
  })

module.exports = router
