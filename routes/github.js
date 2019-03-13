const express = require('express')
const controller = require('../controller/GithubController')
const router = express.Router()

router.route('*')
  .all(async (req, res, next) => {
    try {
      await controller.verifyRequest(req)
      next()
    } catch (err) { next(err) }
  })

router.route('/user')
  .get(async (req, res, next) => {
    try {
      const userInfo = await controller.getUser(req.token)
      userInfo._orgsLink = `/user/orgs`

      res.send(userInfo)
    } catch (err) { next(err) }
  })

router.route('/user/orgs')
  .get(async (req, res, next) => {
    try {
      const orgs = await controller.getUserOrgs(req.token)

      res.send(orgs)
    } catch (err) { next(err) }
  })

router.route('/user/orgs/:orgName/hook')
  .all(async (req, res, next) => {
    try {
      await controller.verifyOrganization(req)
      next()
    } catch (err) { next(err) }
  })
  .get(async (req, res, next) => {
    try {
      const hook = await controller.getUserOrgHook(req.org, req.token)

      res.send(hook)
    } catch (err) { next(err) }
  })
  .post(async (req, res, next) => {
    try {
      await controller.createUserOrgHook(req.org, req.token)

      res.status(204).send('')
    } catch (err) { next(err) }
  })
  .delete(async (req, res, next) => {
    try {
      await controller.deleteUserOrgHook(req.org, req.token)

      res.status(204).send('')
    } catch (err) { next(err) }
  })

module.exports = router
