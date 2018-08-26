const helper = require('./lib/helper')
const config = require('./config.json')

helper.setLogLevel(config.log_level)

const AuthManager = require('./lib/AuthenticationManager')
const authManager = new AuthManager(config.timeout, config.authentication)

const WebServer = require('./lib/WebServer')
const ProxyServer = require('./lib/ProxyServer')

const webServer = new WebServer(authManager, config.trust_proxy)
const proxyServer = new ProxyServer(authManager, config.backends)

webServer.listen(config.web_port)
proxyServer.listen(config.proxy_port)
