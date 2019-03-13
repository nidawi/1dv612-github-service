const express = require('express')
const controller = require('../controller/HooksController')
const router = express.Router()

router.route('/')
  .post(async (req, res, next) => {
    try {
      const hookData = {
        userAgent: req.headers['user-agent'],
        delivery: req.headers['x-github-delivery'],
        signature: req.headers['x-hub-signature'],
        event: req.headers['x-github-event'],
        payload: req.body
      }

      controller.verifySignature(hookData)
      const data = _constructDataObject(hookData.event, req.body)
      if (data.event !== 'ping') {
        console.log(`Webhook Event: ${data.event}`)
        controller.sendToGateway(data)
      } else console.log('Webhook was pinged:', data)

      res.status(204).send('')
    } catch (err) { next(err) }
  })

const _constructDataObject = (event, payload) => {
  return {
    event: event,
    action: payload.action,
    timestamp: new Date().getTime(),
    organization: payload.organization ? {
      code: payload.organization.login,
      id: payload.organization.id,
      avatar: payload.organization.avatar_url
    } : undefined,
    repository: payload.repository ? {
      id: payload.repository.id,
      name: payload.repository.name,
      private: payload.repository.private
    } : undefined,
    sender: payload.sender ? {
      username: payload.sender.login,
      id: payload.sender.id,
      avatar: payload.sender.avatar_url
    } : undefined,
    issue: payload.issue ? {
      id: payload.issue.id,
      title: payload.issue.title,
      number: payload.issue.number,
      user: {
        username: payload.issue.user.login,
        id: payload.issue.user.id,
        avatar: payload.issue.user.avatar_url
      },
      createdAt: payload.issue.created_at,
      state: payload.issue.state,
      locked: payload.issue.locked,
      comments: payload.issue.comments,
      body: payload.issue.body
    } : undefined,
    comment: payload.comment ? {
      id: payload.comment.id,
      createdAt: payload.comment.created_at,
      body: payload.comment.body,
      user: {
        username: payload.comment.user.login,
        id: payload.comment.user.id,
        avatar: payload.comment.user.avatar_url
      }
    } : undefined,
    push: payload.pusher ? {
      ref: payload.ref,
      size: payload.size,
      created: payload.created,
      deleted: payload.deleted,
      forced: payload.forced
    } : undefined,
    release: payload.release ? {
      id: payload.release.id,
      tag: payload.release.tag_name,
      preRelease: payload.release.prerelease,
      createdAt: payload.created_at,
      author: {
        username: payload.release.author.login,
        id: payload.release.author.id,
        avatar: payload.release.author.avatar_url
      }
    } : undefined,
    membership: payload.membership ? {
      state: payload.membership.state,
      role: payload.membership.role,
      user: {
        username: payload.membership.user.login,
        id: payload.membership.user.id,
        avatar: payload.membership.user.avatar_url
      }
    } : undefined
  }
}

module.exports = router
