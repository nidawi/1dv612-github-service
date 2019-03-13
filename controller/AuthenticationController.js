const github = require('../lib/github')
const HTTPErrors = require('../lib/HTTPErrors')
const HTTPMessage = require('../lib/HTTPMessage')

// Track states that we have authorized.
const authenticationState = {
  validStates: []
}

module.exports.initiateAuthentication = () => {
  // Initiates a new authentication flow.
  const state = github.generateStateToken()
  const expiration = _authorizeState(state)
  const link = github.getAuthenticationUrl(state)

  return {
    url: link,
    state: state,
    issuedAt: new Date().getTime(),
    expiresAt: expiration
  }
}
module.exports.finalizeAuthentication = async (code, state) => {
  if (!code) {
    throw new HTTPErrors.BadRequestError('Bad Authorization: Code Missing')
  }
  if (!state) {
    throw new HTTPErrors.BadRequestError('Bad Authorization: State Missing')
  }
  if (!authenticationState.validStates.includes(state)) {
    throw new HTTPErrors.BadRequestError('Bad Authorization: Invalid State')
  }

  const accessToken = await github.requestAccessToken(code, state)
  if (accessToken) {
    return accessToken
  }

  throw new HTTPErrors.BadRequestError('Bad Authorization: Github Rejected Data')
}
module.exports.notifyAPIGateway = async (token, state) => {
  const result = await HTTPMessage.sendPOST(
    `${process.env.links.gateway}/internals/github/auth`, {
      token: token,
      state: state
    }
  )

  if (!result.success) {
    throw new HTTPErrors.InternalError('Authentication Failure: Try Again Later')
  }
}

const _authorizeState = (state) => {
  authenticationState.validStates.push(state)
  const expiration = 1000 * 60 * 10
  setTimeout(() => {
    authenticationState.validStates = authenticationState.validStates.filter(a => a !== state)
  }, expiration)

  return new Date().getTime() + expiration
}
