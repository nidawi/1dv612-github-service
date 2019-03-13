// Controller for the main route
const github = require('../lib/github')
const HTTPErrors = require('../lib/HTTPErrors')

// Todo: More expressive errors?
// Verification should not depend on req

module.exports.verifyRequest = async req => {
  if (!(req.token = req.headers['x-github-access-token'])) {
    throw new HTTPErrors.BadRequestError('No Github Access Token Provided')
  }
}
module.exports.verifyOrganization = async (req) => {
  if (!req.params.orgName) {
    throw new HTTPErrors.BadRequestError('No Github Organization Provided')
  }

  const userOrg = await github.requestUserOrganizations(req.token)
  if (!userOrg || userOrg.length < 1) {
    throw new HTTPErrors.BadRequestError('Invalid Organization or Authentication provided.')
  }

  const relevantOrg = userOrg.find(a => a.code === req.params.orgName)
  if (!relevantOrg) {
    throw new HTTPErrors.BadRequestError('Invalid Github Organization Provided')
  }

  req.org = relevantOrg.code
}

module.exports.getUser = async token => {
  const result = await github.requestUser(token)
  if (result) return result
  else throw new HTTPErrors.BadRequestError()
}
module.exports.getUserOrgs = async token => {
  const result = await github.requestUserOrganizations(token)
  if (result) return result
  else throw new HTTPErrors.BadRequestError()
}

module.exports.getUserOrgHook = async (orgName, token) => {
  const result = await github.requestWebhook(orgName, token)
  if (result) return result
  else throw new HTTPErrors.BadRequestError()
}
module.exports.createUserOrgHook = async (orgName, token) => {
  const result = await github.createWebhook(orgName, token)
  if (result) return result
  else throw new HTTPErrors.BadRequestError()
}
module.exports.deleteUserOrgHook = async (orgName, token) => {
  const result = await github.deleteWebhook(orgName, token)
  if (result) return result
  else throw new HTTPErrors.BadRequestError()
}
