const express = require('express')
const controller = require('../controller/AuthenticationController')
const router = express.Router()

// Route used for authentication mediation
router.route('/')
  .get(async (req, res, next) => {
    // Initiate a new authentication flow.
    try {
      const authentcation = controller.initiateAuthentication()

      res.send(authentcation)
    } catch (err) { next(err) }
  })

module.exports = router
