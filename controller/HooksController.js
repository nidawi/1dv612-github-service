const HTTPErrors = require('../lib/HTTPErrors')
const socket = require('../config/server').refs.webSocket
const crypto = require('crypto')
const safeCompare = require('safe-compare')

module.exports.verifySignature = (data) => {
  if (!Object.entries(data).every(a => a[0] && a[1])) {
    throw new HTTPErrors.BadRequestError('Hook Verification Failed: Data Missing')
  }
  if (!data.payload || typeof data.payload !== 'object') {
    throw new HTTPErrors.BadRequestError('Hook Verification Failed: Invalid Payload')
  }
  if (!data.signature || typeof data.signature !== 'string') {
    throw new HTTPErrors.BadRequestError('Hook Verification Failed: Invalid Signture')
  }

  const payload = JSON.stringify(data.payload)

  const hmac = crypto.createHmac('sha1', process.env.github.hookSecret)
  hmac.update(payload)

  const signature = `sha1=${hmac.digest('hex')}`

  if (!safeCompare(data.signature, signature)) {
    throw new HTTPErrors.BadRequestError('Hook Verification Failed: Invalid Signture')
  }
}
module.exports.sendToGateway = (data) => {
  try {
    socket.to('listeners').emit('githubEvent', data)
  } catch (err) {
    console.log(`Github Event Failed Sending to Gateway: ${err}`)
  }
}
