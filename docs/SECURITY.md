# Security Policy

## MCP Server Security

### Running as Non-Root

The Bytepad MCP server Docker image runs as a non-root user (`bytepad`, UID 1001) to minimize security risks. This prevents:

- Container escape vulnerabilities
- Host filesystem access outside mounted volumes
- Privilege escalation attacks

### Secrets Management

**Never bake secrets into images.** Always pass sensitive data at runtime:

```bash
# Via environment variables
docker run -e GITHUB_TOKEN=xxx ...

# Via .env file (not committed)
docker run --env-file .env ...
```

### Required Token Scopes

| Token | Scope | Purpose |
|-------|-------|---------|
| `GITHUB_TOKEN` | `gist` | Read/write access to Gists only |
| `TAVILY_API_KEY` | N/A | Web search functionality |

**Minimal scope principle:** Only request the permissions you need.

### GitHub Personal Access Token (PAT)

To create a token with minimal permissions:

1. Go to GitHub → Settings → Developer settings → Personal access tokens
2. Click "Generate new token (classic)"
3. Select **only** the `gist` scope
4. Set an expiration date (recommended: 90 days)
5. Store securely and rotate regularly

### Files to Never Commit

Add these to your `.gitignore`:

```
.env
.env.local
.env.*.local
*.pem
*.key
credentials.json
```

The repository already includes proper `.gitignore` entries.

### Data Storage

- Data is stored in `/app/data/bytepad-data.json`
- Use Docker volumes for persistence
- Backup your data regularly
- Consider encrypting sensitive notes

### Network Security

The MCP server uses **stdio transport**, meaning:

- No network ports are exposed
- Communication happens via stdin/stdout
- No HTTP endpoints to attack
- Secure by design

### Reporting Vulnerabilities

If you discover a security vulnerability:

1. **Do not** open a public issue
2. Email the maintainers privately
3. Allow 90 days for a fix before disclosure
4. We appreciate responsible disclosure

### Container Scanning

We recommend scanning the image for vulnerabilities:

```bash
# Using Trivy
trivy image ghcr.io/samitugal/bytepad-mcp-server:latest

# Using Docker Scout
docker scout cves ghcr.io/samitugal/bytepad-mcp-server:latest
```

### Best Practices

1. **Keep images updated** - Pull `:latest` regularly for security patches
2. **Use version tags** - Pin to specific versions in production
3. **Rotate tokens** - Change GitHub tokens periodically
4. **Limit volume mounts** - Only mount what's necessary
5. **Review logs** - Check for suspicious activity

### Supported Versions

| Version | Supported |
|---------|-----------|
| Latest  | ✅ |
| < 1.0   | ❌ |

Only the latest version receives security updates.
