// Imported Functionality
const request = require('request-promise-native')
const base64url = require('base64url').default

const githubConfig = {
  usedContentType: 'application/json',
  githubMainUri: 'https://api.github.com'
}

// Exported Functions
module.exports.generateStateToken = (length = 30) => {
  const pool = 'abcdefghijklmnopqrstuvwxyz0123456789'.split('')
  return base64url.encode(new Array(length)
    .fill('')
    .map(a => pool[(Math.ceil(Math.random() * pool.length)) - 1])
    .join(''))
}
module.exports.getAuthenticationUrl = (state) => {
  return `https://github.com/login/oauth/authorize?client_id=${process.env.github.clientId}&scope=${_getAuthenticationScopes()}&redirect_uri=${process.env.github.redirectUrl}&state=${state || module.exports.generateStateToken()}`
}
module.exports.requestAccessToken = async (code, state) => {
  // Attempt to request an access token.
  const requestOpts = {
    uri: 'https://github.com/login/oauth/access_token',
    method: 'POST',
    body: {
      client_id: process.env.github.clientId,
      client_secret: process.env.github.clientSecret,
      redirect_uri: process.env.github.redirectUrl,
      code: code,
      state: state
    }
  }

  const result = await _sendGithubRequest(requestOpts)
  if (result.success && result.githubSuccess) {
    return result.data.access_token
  }
}
module.exports.requestUser = async token => {
  const requestOpts = {
    uri: `${githubConfig.githubMainUri}/user`, // Also accessible at: https://api.github.com/users/nidawi but this one is safer becase we don't need to know the username.
    auth: token
  }

  // We may need more here later.
  const result = await _sendGithubRequest(requestOpts)
  if (result.success && result.githubSuccess) {
    return {
      username: result.data.login,
      id: result.data.id,
      avatar: result.data.avatar_url
    }
  }
}
module.exports.requestUserOrganizations = async token => {
  const requestOpts = {
    uri: `${githubConfig.githubMainUri}/user/orgs`,
    auth: token
  }

  // May need more.
  const result = await _sendGithubRequest(requestOpts)
  if (result.success && result.githubSuccess) {
    return Promise.all(result.data.map(async a => {
      const additionalInfo = await Promise.all([
        _requestOrganization(a.login, token),
        _requestOrganizationHooks(a.login, token)
      ])
      const orgInfo = additionalInfo[0]
      const hookInfo = additionalInfo[1]

      return Object.assign({
        id: a.id,
        code: a.login,
        avatar: a.avatar_url,
        hasHookPermissions: hookInfo !== undefined,
        hasHookRegistered: hookInfo ? Boolean(hookInfo.find(a => a.hookUrl === process.env.github.hookPayloadUrl)) : false
      }, orgInfo)
    }))
  }
}
module.exports.requestWebhook = async (orgName, token) => {
  const hooks = await _requestOrganizationHooks(orgName, token)
  return hooks.find(a => a.hookUrl === process.env.github.hookPayloadUrl)
}
module.exports.createWebhook = async (orgName, token) => {
  const requestOpts = {
    uri: `${githubConfig.githubMainUri}/orgs/${orgName}/hooks`,
    method: 'POST',
    body: {
      name: 'web',
      active: true,
      events: [
        'release',
        'repository',
        'push',
        'issues',
        'issue_comment',
        'organization'
      ],
      config: {
        url: process.env.github.hookPayloadUrl,
        content_type: 'json',
        secret: process.env.github.hookSecret
      }
    },
    auth: token
  }

  const result = await _sendGithubRequest(requestOpts)
  return (result.success && result.githubSuccess)
}
module.exports.deleteWebhook = async (orgName, token) => {
  const hookInfo = await module.exports.requestWebhook(orgName, token)
  if (hookInfo) {
    const requestOpts = {
      uri: `${githubConfig.githubMainUri}/orgs/${orgName}/hooks/${hookInfo.id}`,
      method: 'DELETE',
      auth: token
    }

    const result = await _sendGithubRequest(requestOpts)
    return (result.success && result.githubSuccess)
  }
}

// Non-exported Functions
const _sendGithubRequest = async config => {
  const rqOptions = {
    uri: config.uri,
    method: config.method || 'GET',
    resolveWithFullResponse: true,
    simple: false,
    headers: {
      'User-Agent': process.env.jwt.iss,
      'Accept': githubConfig.usedContentType,
      'Content-Type': githubConfig.usedContentType,
      'Authorization': config.auth ? `token ${config.auth}` : undefined
    },
    body: config.body,
    formData: config.formData,
    json: (config.formData || config.body) ? true : undefined
  }

  try {
    const response = await request(rqOptions)
    const body = _tryParse(response.body) || response.body

    // The response is returned as an object with relevant data.
    return {
      success: ([200, 201, 204, 304].indexOf(response.statusCode) > -1),
      githubSuccess: !body.error, // Github errors return 200 for some reason
      githubErrorMessage: body.error_description,
      code: response.statusCode,
      data: body
    }
  } catch (err) {
    console.log(`Github Request Failed: ${err}`)
    return {
      success: false,
      data: err.constructor.name
    }
  }
}
const _tryParse = body => {
  try {
    return JSON.parse(body)
  } catch (err) { }
}

const _requestOrganization = async (orgName, token) => {
  const requestOpts = {
    uri: `${githubConfig.githubMainUri}/orgs/${orgName}`,
    auth: token
  }

  const result = await _sendGithubRequest(requestOpts)
  if (result.success && result.githubSuccess) {
    return {
      id: result.data.id,
      code: result.data.login,
      name: result.data.name,
      description: result.data.description,
      contact: result.data.email
    }
  }
}
const _requestOrganizationHooks = async (orgName, token) => {
  const requestOpts = {
    uri: `${githubConfig.githubMainUri}/orgs/${orgName}/hooks`,
    auth: token
  }

  const result = await _sendGithubRequest(requestOpts)
  if (result.success && result.githubSuccess) {
    return result.data.map(a => {
      return {
        id: a.id,
        active: a.active,
        events: a.events,
        hookUrl: a.config.url,
        _hookLink: a.url
      }
    })
  }
}

const _getAuthenticationScopes = () => {
  return process.env.github.scopes
    .join(',')
}
