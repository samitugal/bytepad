import { useState, useEffect } from 'react';
import type { MCPServerInfo } from '../../types/electron';

export function MCPSettings() {
  const [serverInfo, setServerInfo] = useState<MCPServerInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const [portInput, setPortInput] = useState('3847');

  const isElectron = !!window.electronAPI?.isElectron;

  // Load server info on mount
  useEffect(() => {
    if (!isElectron) {
      setIsLoading(false);
      return;
    }

    loadServerInfo();
  }, [isElectron]);

  const loadServerInfo = async () => {
    try {
      const info = await window.electronAPI?.mcp.getServerInfo();
      if (info) {
        setServerInfo(info);
        setPortInput(info.port.toString());
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleServer = async () => {
    if (!serverInfo) return;

    setError(null);
    try {
      const result = await window.electronAPI?.mcp.setEnabled(!serverInfo.isRunning);
      if (!result?.success) {
        setError(result?.error || 'Failed to toggle server');
      }
      await loadServerInfo();
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
      await loadServerInfo();
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
      await loadServerInfo();
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

  return (
    <div className="space-y-4">
      <h3 className="text-sm text-np-green mb-3">// MCP Server</h3>

      {/* Server Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              serverInfo?.isRunning ? 'bg-np-green' : 'bg-np-text-secondary'
            }`}
          />
          <span className="text-sm text-np-text-secondary">
            {serverInfo?.isRunning ? 'Running' : 'Stopped'}
          </span>
          {serverInfo?.isRunning && (
            <span className="text-xs text-np-text-secondary">
              on port {serverInfo.port}
            </span>
          )}
        </div>
        <button
          onClick={handleToggleServer}
          className={`np-btn text-xs ${serverInfo?.isRunning ? 'text-np-error' : 'text-np-green'}`}
        >
          {serverInfo?.isRunning ? 'Stop' : 'Start'}
        </button>
      </div>

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
      {serverInfo?.isRunning && (
        <div className="text-xs text-np-text-secondary">
          Connected clients: {serverInfo.connectedClients}
          {serverInfo.startedAt && (
            <span className="ml-2">
              (started {new Date(serverInfo.startedAt).toLocaleTimeString()})
            </span>
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
