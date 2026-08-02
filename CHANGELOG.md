# Changelog

All notable user-facing changes to bytepad are documented here. Format is
loosely [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

> **Note on completeness:** this file was dormant for a long stretch of the
> project's history and was recreated starting from the `0.25.0` release.
> Entries before that point are not tracked here — check the GitHub
> [releases page](https://github.com/samitugal/bytepad/releases) and commit
> history for anything earlier. Going forward, every tagged release gets an
> entry (see `docs/VERSION_LOCATIONS.md` for the version-bump steps that
> include this file).
>
> Security-relevant fixes are intentionally not itemized here — see
> [`SECURITY.md`](SECURITY.md) for how to report or ask about those.

## [0.25.0] - 2026-08-02

A maintenance release focused on defaults, sync robustness, and CI coverage.

### Fixed
- Production web bundle failing to start
- Container image now builds from a clean checkout, and its search endpoints are reachable
- Level progression is preserved across the updated level table — existing XP, streaks and achievements carry over

### Changed
- Continuous integration now runs linting, type-checking and builds on every change, including the Electron main process and the container server
- Firestore access rules are now included in the repo, along with the setup steps to deploy them
- Numerous dependency updates

### Contributors
- First contribution from [@lulunac27a](https://github.com/lulunac27a) — level progression rework groundwork
