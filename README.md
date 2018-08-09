# inaba
Inaba is a socket operator, designed for exposing multiple services with just one or two port. 
(One runs on http so you can use a reverse proxy for multiplexing)

## How-to
Create your own `config.json` from `config.example.json`, and start it with `screen` or `pm2` or whatever.

Users can visit the `web_port` to choose the backend they want to connect, then the connections to the 
`proxy_port` will be directed to the backend they choosed.

By default, the web server is configured to trust proxies from `loopback` so it can detect user's ip address
behind a reverse proxy. You can disable this feature by setting `trust_proxy` to `null`.

## Authenticators
Inaba can use built-in authenticators (located at `lib/authenticators`) or authenticators published on `npm` 
(packages named `inaba-auth-{xxx}`)

For now, there is only a simple key-based authenticator (`secret`), but you can build your own base on that.

## License
[GNU General Public License v2.0](LICENSE)
