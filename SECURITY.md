# Security Policy

## Supported versions

| Version | Supported |
| ------- | --------- |
| 1.x     | Yes       |

## Reporting a vulnerability

Please report security issues privately, **not** as a public issue:

- Open a [private security advisory](https://github.com/ajaymahato431/frontlens-mcp/security/advisories/new), or
- Contact the maintainer through their [GitHub profile](https://github.com/ajaymahato431).

Please include what you found, how to reproduce it, and what an attacker could
achieve. You can expect an initial response within seven days.

## Security model

Understanding what this server does makes it easier to judge a finding:

- It runs **locally**, as a subprocess of your MCP client, communicating over
  stdio. It opens no listening port.
- It makes **outbound HTTPS requests only**, to official public documentation sites
  and raw GitHub endpoints named in the documentation.
- Project inspection reads local package configuration files (`package.json`, lockfiles,
  and framework config files) in read-only mode and executes no arbitrary code.
- It requires **no credentials**. `GITHUB_TOKEN`, where supported, is optional
  and used solely to raise anonymous GitHub rate limits.

## Dependency advisories

`npm audit` may report advisories against packages pulled in indirectly by
`@modelcontextprotocol/sdk`. None are reachable from this server: the SDK's HTTP
transport stack is not imported or used. FrontLens uses **only stdio**.
