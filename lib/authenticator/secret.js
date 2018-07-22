module.exports = function (params, query) {
  let secret = query.secret
  if (!secret) {
    return Promise.reject(new Error('secret should not be empty'))
  }

  let backends = params[secret]
  if (backends) {
    return Promise.resolve(backends)
  } else {
    return Promise.reject(new Error('secret cannot be matched'))
  }
}
