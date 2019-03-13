const crypto = require('crypto')
const base64url = require('base64url').default
const safeCompare = require('safe-compare')

const encoding = 'utf-8'
const header = {
  alg: 'HS256',
  typ: 'JWT'
}

// This solution is temporary and could use a lot of work.
// I like doing things myself so I "learn" how they work.
// I am aware that there are like 18 billion libraries for this.
// This solution does currently not at all care about the header and
// just assumes that it will be in HS256.
// Note: as far as I know, HS256 = hmac sha256

const _encode = value => base64url.encode(JSON.stringify(value), encoding)
const _decode = value => JSON.parse(base64url.decode(value, encoding))

const _createSignature = (header, payload) => {
  const hmac = crypto.createHmac('sha256', process.env.jwt.secret)
  hmac.update(`${header}.${payload}`)
  return base64url.encode(hmac.digest(), encoding)
}

/**
 * Signs the given payload.
 * @param {*} payload The payload to sign.
 * @param {Object} [opt] Options.
 * @param {number} [opt.expiration] UNIX timestamp (in seconds) when the JWT should expire.
 * @param {string} [opt.aud] The intended audience.
 * @returns {string}
 */
module.exports.sign = (payload, opt) => {
  // Create the base payload values.
  const _basePayload = {
    iss: process.env.jwt.iss,
    aud: (opt ? opt.aud : undefined) || process.env.jwt.aud,
    exp: (opt ? opt.expiration : undefined) || (parseInt((new Date().getTime() / 1000).toFixed(0)) + process.env.jwt.expiration),
    iat: parseInt((new Date().getTime() / 1000).toFixed(0))
  }

  const _header = _encode(header)
  const _payload = _encode(Object.assign(payload, _basePayload))

  return `${_header}.${_payload}.${_createSignature(_header, _payload)}`
}

/**
 * Verifies the given JWT and returns the payload if successful, otherwise undefined.
 * @param {string} token The token to verify.
 * @todo This needs more error management. What if "parts" is undefined or empty?
 * @todo This should probably throw specific errors rather than returning undefined.
 * @returns {*}
 */
module.exports.verify = (token, pub = false) => {
  const parts = token.split('.')

  if (parts.length === 3) {
    const constructedSignature = _createSignature(parts[0], parts[1])
    const deliverySignature = parts[2]

    if (safeCompare(constructedSignature, deliverySignature)) {
      // The signatures match. Time to check iss, aud, exp.
      const payload = _decode(parts[1]) // parse the body.

      const expValid = payload.exp && (new Date(payload.exp * 1000) > new Date())
      const issValid = payload.iss && (process.env.jwt.valid_iss.indexOf(payload.iss) > -1)

      const validAuds = pub
        ? process.env.jwt.valid_aud_public
        : process.env.jwt.valid_aud_private

      const audValid = payload.aud && (Array.isArray(payload.aud)
        ? validAuds.some(a => payload.aud.indexOf(a) > -1)
        : validAuds.indexOf(payload.aud) > -1)

      if (expValid && issValid && audValid) {
        // JWT is valid.
        return payload
      }
    }
  }
}
