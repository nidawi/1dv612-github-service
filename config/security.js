const jwt = require('../lib/jwt')
const apiConfig = require('./apiconfig')
const HTTPErrors = require('../lib/HTTPErrors')

const verifyToken = (authorization, pub = false) => {
  if (!authorization || typeof authorization !== 'string') {
    throw new HTTPErrors.UnauthorizedError('Bad Authentication: Token Missing')
  } else if (!new RegExp(/^[B|b]earer/).test(authorization)) {
    throw new HTTPErrors.UnauthorizedError('Bad Authentication: Wrong Method')
  }

  const token = authorization.replace(/[B|b]earer /, '')
  const payload = jwt.verify(token, pub)

  if (!payload) {
    throw new HTTPErrors.UnauthorizedError('Bad Authentication: Invalid Token')
  }

  return payload
}

module.exports.socketTokenVerification = token => {
  try {
    return verifyToken(token, apiConfig.isPublicAPI)
  } catch (err) { }
}

module.exports.userTokenVerification = (req, res, next) => {
  try {
    req.jwt = verifyToken(req.headers.authorization, true)
    next()
  } catch (err) {
    next(err)
  }
}

module.exports.serviceTokenVerification = (req, res, next) => {
  try {
    req.jwt = verifyToken(req.headers.authorization)
    next()
  } catch (err) {
    next(err)
  }
}

module.exports.requestVerifiction = (req, res, next) => {
  // Verify Method
  if (apiConfig.shouldCheckMethod && apiConfig.acceptedMethods.indexOf(req.method) < 0) {
    return next(new HTTPErrors.MethodNotAllowed('Bad Method: Not Allowed'))
  }

  // Verify Content-Type
  if (apiConfig.shouldCheckAccepted && (!_verifyReqAccept(req.headers['accept']) || !apiConfig.acceptedContentTypes.some(a => req.accepts(a)))) {
    return next(new HTTPErrors.Unacceptable('Expected Content Type: Unacceptable'))
  }

  // Verify Content Type
  if (apiConfig.shouldCheckContentType && ((['POST', 'PATCH', 'PUT'].indexOf(req.method) > -1) && (req.headers['content-type'] !== apiConfig.contentType))) {
    return next(new HTTPErrors.Unacceptable('Provided Content Type: Unacceptable'))
  }

  return next()
}

const _verifyReqAccept = accept => {
  return Array.isArray(accept)
    ? accept.length > 0
    : (accept && accept.length > 0 && accept !== '*/*')
}
