class GenericApplicationError extends Error {
  constructor (message, code) {
    super(message)
    this.code = code
  }
}
const derivedErrors = {
  InternalError: class InternalError extends GenericApplicationError {
    constructor (message) {
      super(message, 500)
    }
  },
  ServiceUnavailable: class ServiceUnavailableError extends GenericApplicationError {
    constructor (message) {
      super(message, 503)
    }
  },
  NotImplemented: class NotImplementedError extends GenericApplicationError {
    constructor (message) {
      super(message, 501)
    }
  },
  PreconditionFailed: class PreconditionFailedError extends GenericApplicationError {
    constructor (message) {
      super(message, 412)
    }
  },
  BadRequestError: class BadRequestError extends GenericApplicationError {
    constructor (message) {
      super(message, 400)
    }
  },
  NotFoundError: class NotFoundError extends GenericApplicationError {
    constructor (message) {
      super(message, 404)
    }
  },
  ForbiddenError: class ForbiddenError extends GenericApplicationError {
    constructor (message) {
      super(message, 403)
    }
  },
  UnauthorizedError: class UnauthorizedError extends GenericApplicationError {
    constructor (message) {
      super(message, 401)
    }
  },
  TooManyRequestsError: class TooManyRequestsError extends GenericApplicationError {
    constructor (message) {
      super(message, 429)
    }
  },
  MethodNotAllowed: class MethodNotAllowedError extends GenericApplicationError {
    constructor (message) {
      super(message, 405)
    }
  },
  Unacceptable: class UnacceptableError extends GenericApplicationError {
    constructor (message) {
      super(message, 406)
    }
  }
}

module.exports = {
  getError: code => {
    return (Object.values(derivedErrors)
      .find(DerErr => {
        const err = new DerErr()
        return err.code === code ? DerErr : undefined
      })) || GenericApplicationError
  },
  GenericApplicationError: GenericApplicationError,
  InternalError: derivedErrors.InternalError,
  ServiceUnavailable: derivedErrors.ServiceUnavailable,
  NotImplemented: derivedErrors.NotImplemented,
  PreconditionFailed: derivedErrors.PreconditionFailed,
  BadRequestError: derivedErrors.BadRequestError,
  NotFoundError: derivedErrors.NotFoundError,
  ForbiddenError: derivedErrors.ForbiddenError,
  UnauthorizedError: derivedErrors.UnauthorizedError,
  TooManyRequestsError: derivedErrors.TooManyRequestsError,
  MethodNotAllowed: derivedErrors.MethodNotAllowed,
  Unacceptable: derivedErrors.Unacceptable
}
