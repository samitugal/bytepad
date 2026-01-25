# Release Process

This document describes how to release new versions of the Bytepad MCP Server.

## Version Scheme

We use [Semantic Versioning](https://semver.org/):

- **MAJOR.MINOR.PATCH** (e.g., `1.2.3`)
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

## Release Checklist

### 1. Prepare the Release

```bash
# Ensure you're on main and up-to-date
git checkout main
git pull origin main

# Update version in package.json
cd mcp-server
npm version patch  # or: minor, major

# This creates a commit and tag automatically
```

### 2. Update Changelog

Edit `docs/internal/CHANGELOG.md`:

```markdown
## [1.2.3] - 2024-01-25

### Added
- New feature X

### Fixed
- Bug Y

### Changed
- Updated Z
```

### 3. Push the Release

```bash
# Push commits and tags
git push origin main
git push origin --tags
```

### 4. Automated CI/CD

Once you push a tag like `v1.2.3`:

1. **GitHub Actions** triggers `docker-publish.yml`
2. Builds multi-arch images (amd64 + arm64)
3. Pushes to GHCR with tags:
   - `ghcr.io/samitugal/bytepad-mcp-server:1.2.3`
   - `ghcr.io/samitugal/bytepad-mcp-server:1.2`
   - `ghcr.io/samitugal/bytepad-mcp-server:1`
   - `ghcr.io/samitugal/bytepad-mcp-server:latest`

### 5. Create GitHub Release

1. Go to GitHub → Releases → "Draft a new release"
2. Select the tag you just pushed
3. Title: `v1.2.3`
4. Description template:

```markdown
## What's Changed

### New Features
- Feature A
- Feature B

### Bug Fixes
- Fixed issue #123

### Breaking Changes
- None (or list them)

## Docker Image

```bash
docker pull ghcr.io/samitugal/bytepad-mcp-server:1.2.3
```

## Full Changelog
https://github.com/samitugal/bytepad/compare/v1.2.2...v1.2.3
```

5. Click "Publish release"

## Hotfix Process

For urgent fixes to production:

```bash
# Create hotfix branch from latest tag
git checkout -b hotfix/critical-bug v1.2.3

# Make the fix
git commit -m "fix: critical bug description"

# Bump patch version
npm version patch

# Merge to main
git checkout main
git merge hotfix/critical-bug

# Push
git push origin main --tags

# Clean up
git branch -d hotfix/critical-bug
```

## Rollback

If a release has issues:

```bash
# Users can pin to previous version
docker pull ghcr.io/samitugal/bytepad-mcp-server:1.2.2

# Or yank the bad release (not recommended)
# Instead, release a patch with the fix
```

## Pre-release / Beta

For testing before stable release:

```bash
# Create pre-release tag
git tag v1.3.0-beta.1
git push origin v1.3.0-beta.1

# This creates image tag: 1.3.0-beta.1
# Does NOT update :latest
```

## Image Tags Explained

| Tag | When Updated | Use Case |
|-----|--------------|----------|
| `latest` | Every main branch push | Development, testing |
| `1.2.3` | On version tag | Production (exact version) |
| `1.2` | On version tag | Production (latest patch) |
| `1` | On version tag | Production (latest minor) |
| `sha-abc123` | Every build | Debugging specific commits |

## Verification

After release, verify:

```bash
# Pull the new image
docker pull ghcr.io/samitugal/bytepad-mcp-server:1.2.3

# Check it runs
docker run --rm ghcr.io/samitugal/bytepad-mcp-server:1.2.3 node --version

# Verify multi-arch
docker manifest inspect ghcr.io/samitugal/bytepad-mcp-server:1.2.3
```

## Troubleshooting Releases

### CI fails to push image

1. Check GitHub Actions logs
2. Ensure `GITHUB_TOKEN` has `packages:write` permission
3. Verify the image name matches repository

### Tag already exists

```bash
# Delete local tag
git tag -d v1.2.3

# Delete remote tag (careful!)
git push origin :refs/tags/v1.2.3
```

### Wrong version released

Don't delete tags. Instead:

1. Create a new patch release with the fix
2. Document the issue in release notes
3. Users should always use the latest patch
