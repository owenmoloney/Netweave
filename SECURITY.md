# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in Netweave, please report it responsibly.

**Do not open a public GitHub issue for security bugs.**

Instead, email the maintainer or open a [GitHub Security Advisory](https://github.com/owenmoloney/Netweave/security/advisories/new). Include:

- A description of the issue
- Steps to reproduce
- Potential impact
- Suggested fix (if you have one)

We aim to acknowledge reports within 72 hours and provide a fix or mitigation plan as soon as possible.

## Sensitive Data

Netweave stores **personal professional contact data** — names, emails, LinkedIn URLs, meeting notes, and relationship context. When self-hosting:

- Change the default `JWT_SECRET` before exposing the app to a network
- Run behind HTTPS if accessible outside your local machine
- Back up your SQLite database file regularly and store backups securely
- Do not commit `.env` files or `*.db` database files to version control

## Supported Versions

| Version | Supported |
|---------|-----------|
| 0.1.x   | Yes       |
