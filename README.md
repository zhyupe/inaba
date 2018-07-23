# inaba
Inaba is a socket operator, designed for exposing multiple services with just one or two port. 
(One runs on http so you can use a reverse proxy for multiplexing)

## How-to
Create your own `config.json` from `config.example.json`, and start it with `screen` or `pm2` or whatever.

Users can visit the `web_port` to choose the backend they want to connect, then connections from will be 
directed to the backend they choosed.

For now, there is only a cli-based interface for users to authenticate and choose backend. A gui-based one 
may be introduced in weeks (or never). So if you are willing to provide help, please open an issue to let me
know. PRs are welcomed.

## Authenticators
Inaba can use built-in authenticators (located at `lib/authenticators`) or authenticators published on `npm` 
(packages named `inaba-auth-{xxx}`)

For now, there is only a simple key-based authenticator (`secret`), but you can build your own base on that.

## License
[GNU General Public License v2.0](LICENSE)
