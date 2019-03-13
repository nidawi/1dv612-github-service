// Used as a wrapper for microservice communication.
const rq = require('request-promise-native')
const jwt = require('./jwt')

const _sendRequest = async config => {
  const rqOptions = {
    uri: config.uri,
    method: config.method,
    resolveWithFullResponse: true,
    simple: false,
    auth: {
      'bearer': jwt.sign({})
    },
    headers: {
      'User-Agent': process.env.jwt.iss,
      'Accept': config.accept || 'application/json',
      'Content-Type': config.body ? 'application/json' : undefined
    },
    body: config.body,
    formData: config.formData,
    json: (config.formData || config.body) ? true : undefined
  }

  try {
    const response = await rq(rqOptions)

    // The response is returned as an object with relevant data.
    // Todo: what about errors that get delivered in the response body?
    return {
      success: ([200, 201, 204, 304].indexOf(response.statusCode) > -1),
      code: response.statusCode,
      data: _tryParse(response.body) || response.body
    }
  } catch (err) {
    console.log(`Internal Request Failed: ${err}`)
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

/**
 * Sends a GET request to a known microservice. The URI of the microservice must be provided.
 * @param {string} uri The URI to the microservice.
 */
module.exports.sendGET = async uri => {
  return _sendRequest({
    uri: uri,
    method: 'GET'
  })
}

/**
 * Sends a POST request to a known microservice. The URI of the microservice must be provided.
 * @param {string} uri The URI to the microservice.
 * @param {*} data The payload to send.
 */
module.exports.sendPOST = (uri, data) => {
  return _sendRequest({
    uri: uri,
    method: 'POST',
    body: data
  })
}

/**
 * Sends a DELETE request to a known microservice. The URI of the microservice must be provided.
 * @param {string} uri The URI to the microservice.
 */
module.exports.sendDELETE = uri => {
  return _sendRequest({
    uri: uri,
    method: 'DELETE'
  })
}
