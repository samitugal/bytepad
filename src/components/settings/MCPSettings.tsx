import { useState, useEffect } from 'react';
import type { MCPServerInfo, DockerStatus } from '../../types/electron';

type MCPMode = 'embedded' | 'docker';

export function MCPSettings() {
  const [serverInfo, setServerInfo] = useState<MCPServerInfo | null>(null);
  const [dockerStatus, setDockerStatus] = useState<DockerStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const [portInput, setPortInput] = useState('3847');
  const [mcpMode, setMcpMode] = useState<MCPMode>('embedded');

  const isElectron = !!window.electronAPI?.isElectron;

  // Load server info and Docker status on mount
  useEffect(() => {
    if (!isElectron) {
      setIsLoading(false);
      return;
    }

    loadStatus();
  }, [isElectron]);

  const loadStatus = async () => {
    try {
      const [info, docker] = await Promise.all([
        window.electronAPI?.mcp.getServerInfo(),
        window.electronAPI?.docker?.getStatus(),
      ]);

      if (info) {
        setServerInfo(info);
        setPortInput(info.port.toString());
      }

      if (docker) {
        setDockerStatus(docker);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleEmbeddedServer = async () => {
    if (!serverInfo) return;

    setError(null);
    setInfoMessage(null);

    try {
      const result = await window.electronAPI?.mcp.setEnabled(!serverInfo.isRunning);
      if (!result?.success) {
        setError(result?.error || 'Failed to toggle server');
      }
      await loadStatus();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleToggleDockerServer = async () => {
    if (!dockerStatus) return;

    setError(null);
    setInfoMessage(null);

    const isCurrentlyRunning = dockerStatus.running;

    try {
      if (isCurrentlyRunning) {
        // Stop Docker container
        const result = await window.electronAPI?.docker.stop();
        if (!result?.success) {
          setError(result?.error || 'Failed to stop Docker container');
        }
      } else {
        // Start Docker container - with pre-checks
        const result = await window.electronAPI?.mcp.setDockerEnabled(true);

        if (!result?.success) {
          // Show appropriate error message based on error code
          if (result?.errorCode === 'DOCKER_NOT_INSTALLED') {
            setInfoMessage('Docker is not installed on your system. Please install Docker Desktop first.');
            setError(null);
          } else if (result?.errorCode === 'DOCKER_NOT_RUNNING') {
            setInfoMessage('Docker Desktop is installed but not running. Please start Docker Desktop.');
            setError(null);
          } else if (result?.errorCode === 'IMAGE_NOT_FOUND') {
            setInfoMessage('Docker image not found. Please build it first:\n\ncd docker/mcp-server && docker-compose build');
            setError(null);
          } else {
            setError(result?.error || 'Failed to start Docker container');
          }
          await loadStatus();
          return;
        }
      }

      await loadStatus();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleRegenerateKey = async () => {
    if (!confirm('Regenerating the API key will invalidate any existing connections. Continue?')) {
      return;
    }

    try {
      await window.electronAPI?.mcp.regenerateApiKey();
      await loadStatus();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleCopyApiKey = async () => {
    if (serverInfo?.apiKey) {
      await navigator.clipboard.writeText(serverInfo.apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePortChange = async () => {
    const port = parseInt(portInput, 10);
    if (isNaN(port) || port < 1024 || port > 65535) {
      setError('Port must be between 1024 and 65535');
      return;
    }

    try {
      await window.electronAPI?.mcp.setPort(port);
      await loadStatus();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  if (!isElectron) {
    return (
      <div className="space-y-4">
        <h3 className="text-sm text-np-green mb-3">// MCP Server</h3>
        <div className="text-xs text-np-text-secondary bg-np-bg-tertiary p-3 border border-np-border">
          <p>MCP Server is only available in the Electron desktop app.</p>
          <p className="mt-2 text-np-cyan">Download the desktop app to use this feature.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h3 className="text-sm text-np-green mb-3">// MCP Server</h3>
        <div className="text-xs text-np-text-secondary">Loading...</div>
      </div>
    );
  }

  const isEmbeddedRunning = serverInfo?.isRunning || false;
  const isDockerRunning = dockerStatus?.running || false;
  const isAnyRunning = isEmbeddedRunning || isDockerRunning;

  return (
    <div className="space-y-4">
      <h3 className="text-sm text-np-green mb-3">// MCP Server</h3>

      {/* Mode Selection */}
      <div className="space-y-2">
        <label className="block text-xs text-np-text-secondary">Mode</label>
        <div className="flex gap-2">
          <button
            onClick={() => setMcpMode('embedded')}
            className={`np-btn text-xs ${
              mcpMode === 'embedded' ? 'text-np-green border-np-green' : 'text-np-text-secondary'
            }`}
          >
            Embedded
          </button>
          <button
            onClick={() => setMcpMode('docker')}
            className={`np-btn text-xs ${
              mcpMode === 'docker' ? 'text-np-blue border-np-blue' : 'text-np-text-secondary'
            }`}
          >
            Docker
          </button>
        </div>
        <p className="text-xs text-np-text-secondary mt-1">
          {mcpMode === 'embedded'
            ? 'Runs inside Electron process (requires app to be open)'
            : 'Runs in Docker container (can run independently)'}
        </p>
      </div>

      {/* Embedded Mode */}
      {mcpMode === 'embedded' && (
        <>
          {/* Server Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  isEmbeddedRunning ? 'bg-np-green' : 'bg-np-text-secondary'
                }`}
              />
              <span className="text-sm text-np-text-secondary">
                {isEmbeddedRunning ? 'Running' : 'Stopped'}
              </span>
              {isEmbeddedRunning && (
                <span className="text-xs text-np-text-secondary">
                  on port {serverInfo?.port}
                </span>
              )}
            </div>
            <button
              onClick={handleToggleEmbeddedServer}
              disabled={isDockerRunning}
              className={`np-btn text-xs ${
                isDockerRunning
                  ? 'text-np-text-secondary cursor-not-allowed'
                  : isEmbeddedRunning
                  ? 'text-np-error'
                  : 'text-np-green'
              }`}
            >
              {isEmbeddedRunning ? 'Stop' : 'Start'}
            </button>
          </div>

          {isDockerRunning && (
            <div className="text-xs text-np-orange bg-np-orange/10 p-2 border border-np-orange">
              Docker mode is active. Stop Docker container to use embedded mode.
            </div>
          )}
        </>
      )}

      {/* Docker Mode */}
      {mcpMode === 'docker' && (
        <>
          {/* Docker Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  isDockerRunning ? 'bg-np-blue' : 'bg-np-text-secondary'
                }`}
              />
              <span className="text-sm text-np-text-secondary">
                {isDockerRunning ? 'Container Running' : 'Container Stopped'}
              </span>
              {isDockerRunning && dockerStatus?.containerStatus && (
                <span className="text-xs text-np-text-secondary">
                  ({dockerStatus.containerStatus})
                </span>
              )}
            </div>
            <button
              onClick={handleToggleDockerServer}
              disabled={isEmbeddedRunning}
              className={`np-btn text-xs ${
                isEmbeddedRunning
                  ? 'text-np-text-secondary cursor-not-allowed'
                  : isDockerRunning
                  ? 'text-np-error'
                  : 'text-np-blue'
              }`}
            >
              {isDockerRunning ? 'Stop' : 'Start'}
            </button>
          </div>

          {isEmbeddedRunning && (
            <div className="text-xs text-np-orange bg-np-orange/10 p-2 border border-np-orange">
              Embedded mode is active. Stop embedded server to use Docker mode.
            </div>
          )}

          {/* Docker Status Info */}
          {!dockerStatus?.installed && !infoMessage && (
            <div className="text-xs text-np-cyan bg-np-cyan/10 p-2 border border-np-cyan">
              <p className="font-semibold">Docker Required</p>
              <p className="mt-1">Install Docker Desktop to use Docker mode:</p>
              <a
                href="https://www.docker.com/products/docker-desktop"
                target="_blank"
                rel="noopener noreferrer"
                className="text-np-blue underline mt-1 block"
                onClick={() => window.electronAPI?.openExternal('https://www.docker.com/products/docker-desktop')}
              >
                Download Docker Desktop
              </a>
            </div>
          )}
        </>
      )}

      {/* Info Message */}
      {infoMessage && (
        <div className="text-xs text-np-cyan bg-np-cyan/10 p-3 border border-np-cyan whitespace-pre-wrap">
          {infoMessage}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="text-xs text-np-error bg-np-error/10 p-2 border border-np-error">
          {error}
        </div>
      )}

      {/* Port Configuration */}
      <div className="space-y-2">
        <label className="block text-xs text-np-text-secondary">Port</label>
        <div className="flex gap-2">
          <input
            type="number"
            value={portInput}
            onChange={(e) => setPortInput(e.target.value)}
            min="1024"
            max="65535"
            className="flex-1 bg-np-bg-primary border border-np-border text-np-text-primary
                       font-mono text-sm px-2 py-1.5 focus:outline-none focus:border-np-blue"
          />
          <button
            onClick={handlePortChange}
            disabled={portInput === serverInfo?.port.toString()}
            className="np-btn text-xs text-np-blue disabled:text-np-text-secondary disabled:cursor-not-allowed"
          >
            Apply
          </button>
        </div>
      </div>

      {/* API Key */}
      <div className="space-y-2">
        <label className="block text-xs text-np-text-secondary">API Key</label>
        <div className="flex gap-2">
          <input
            type={showApiKey ? 'text' : 'password'}
            value={serverInfo?.apiKey || ''}
            readOnly
            className="flex-1 bg-np-bg-primary border border-np-border text-np-text-primary
                       font-mono text-xs px-2 py-1.5"
          />
          <button
            onClick={() => setShowApiKey(!showApiKey)}
            className="np-btn text-xs text-np-text-secondary"
          >
            {showApiKey ? 'Hide' : 'Show'}
          </button>
          <button onClick={handleCopyApiKey} className="np-btn text-xs text-np-blue">
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <button
          onClick={handleRegenerateKey}
          className="text-xs text-np-text-secondary hover:text-np-error"
        >
          Regenerate Key
        </button>
      </div>

      {/* Connected Clients */}
      {isAnyRunning && (
        <div className="text-xs text-np-text-secondary">
          {mcpMode === 'embedded' && serverInfo?.isRunning && (
            <>
              Connected clients: {serverInfo.connectedClients}
              {serverInfo.startedAt && (
                <span className="ml-2">
                  (started {new Date(serverInfo.startedAt).toLocaleTimeString()})
                </span>
              )}
            </>
          )}
          {mcpMode === 'docker' && dockerStatus?.running && (
            <>Container ID: {dockerStatus.containerId?.slice(0, 12)}</>
          )}
        </div>
      )}

      {/* Usage Instructions */}
      <div className="mt-4 pt-4 border-t border-np-border">
        <h4 className="text-xs text-np-text-secondary mb-2">Docker Usage</h4>
        <pre className="text-xs bg-np-bg-tertiary p-2 border border-np-border overflow-x-auto">
{`curl -H "Authorization: Bearer <API_KEY>" \\
  http://host.docker.internal:${serverInfo?.port || 3847}/api/health`}
        </pre>

        <h4 className="text-xs text-np-text-secondary mt-3 mb-2">Claude Desktop Config</h4>
        <pre className="text-xs bg-np-bg-tertiary p-2 border border-np-border overflow-x-auto">
{`{
  "mcpServers": {
    "bytepad": {
      "url": "http://localhost:${serverInfo?.port || 3847}/mcp",
      "headers": {
        "Authorization": "Bearer <API_KEY>"
      }
    }
  }
}`}
        </pre>
      </div>

      {/* API Endpoints */}
      <div className="mt-4 pt-4 border-t border-np-border">
        <h4 className="text-xs text-np-text-secondary mb-2">Available Endpoints</h4>
        <div className="text-xs text-np-text-secondary space-y-1 font-mono">
          <div>GET /api/health - Server status</div>
          <div>GET /api/notes - List notes</div>
          <div>GET /api/tasks - List tasks</div>
          <div>GET /api/habits - List habits</div>
          <div>GET /api/journal - List journal entries</div>
          <div>GET /api/bookmarks - List bookmarks</div>
          <div>GET /api/ideas - List ideas</div>
          <div>GET /api/bulk/today - Today's summary</div>
          <div>GET /api/bulk/stats - Overall statistics</div>
          <div>POST /api/sync/trigger - Trigger Gist sync</div>
        </div>
      </div>
    </div>
  );
}
