# Security Policy

bytepad is a local-first productivity app (PWA + Electron desktop). This document explains what's covered by this policy and how to report a security issue privately.

## Supported Versions

Only the latest release is supported. There is no long-term-support (LTS) branch, and older versions do not receive security fixes — please upgrade to the current release before reporting an issue to confirm it's still present.

| Version | Supported |
| ------- | --------- |
| 0.25.x (latest) | ✅ |
| Older releases | ❌ |

## Reporting a Vulnerability

**Please do not open a public GitHub issue for security vulnerabilities.** Public issues are visible to everyone, including before a fix is available.

Instead, use GitHub's private vulnerability reporting for this repository:

👉 [Report a vulnerability](https://github.com/samitugal/bytepad/security/advisories/new)

This opens a private draft security advisory that only the maintainer can see, and lets us discuss and fix the issue before any public disclosure.

If you're unable to use that form for some reason, you can reach the maintainer directly at the email address listed in [package.json](package.json) / on the [GitHub profile](https://github.com/samitugal).

Please include as much of the following as you can:

- A description of the vulnerability and its potential impact
- Steps to reproduce, or a proof of concept
- The affected version and platform (web/PWA, Windows, macOS, Linux)

### What to expect

bytepad is maintained by a single person as a side project, so please bear with me on timelines. What you can expect:

- An acknowledgement of your report, typically within a few days.
- Honest communication about whether and when a fix is planned. I can't promise a fixed SLA, but I take security reports seriously and will prioritize genuine vulnerabilities over other work.
- Credit in the release notes or advisory, if you'd like it, once a fix ships.

## Scope

bytepad is a local-first app: your notes, tasks, and other data live on your device by default, and most functionality has no network dependency at all. The parts of the project where a security report is most relevant are:

- The embedded **MCP server** (local tool-calling server used by AI clients)
- The **Docker image**, if you run the MCP server containerized
- The **Electron main process** (native APIs, IPC, auto-update, filesystem access)
- **Cloud sync** code as shipped in this repository (GitHub Gist sync, and the client-side Firebase sync integration)

### Out of scope

- Vulnerabilities in a self-hosted Firebase project or GitHub account you configure for sync — those are your infrastructure, not this project's code. If you find a bug in how bytepad *uses* Firebase or GitHub (e.g. an insecure API call, data sent somewhere it shouldn't be), that's in scope; the security posture of your own cloud project is not.
- Vulnerabilities in third-party dependencies with no demonstrated impact on bytepad specifically — please report those upstream. If you believe a dependency issue is exploitable through bytepad, let us know and we'll evaluate it here.
- Issues that require physical access to an already-unlocked device, or a device the attacker already fully controls.
- Social engineering, phishing, or issues that don't involve bytepad's code (e.g. a fake bytepad download from a third-party site).

When in doubt, report it privately anyway — it's easier to rule something out than to miss it.
