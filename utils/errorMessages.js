const unauthorised = { status: 401 , message: "Unauthorized" }
const invalidCredentials = { status: 403, message: "invalid credentials" }
const timeout = { status: 401, message: "Token Expired" }

const EM = { unauthorised, invalidCredentials, timeout }

module.exports = EM