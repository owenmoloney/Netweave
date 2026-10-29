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

Netweave stores **personal professional contact data** — names, emails, LinkedIn URLs, meeting notes, and relationship context.

- Row Level Security on `nodes` and `edges` is the access control. Verify a second account cannot read the first graph.
- Never put the Supabase **service role** key in the Vite client or Vercel env. The anon key is public by design.
- Back up the Supabase database regularly.
- Do not commit `.env` files to version control.

## Supported Versions

| Version | Supported |
|---------|-----------|
| 0.1.x   | Yes       |
