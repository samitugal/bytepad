// Cross-tab synchronization using BroadcastChannel API
// This syncs Zustand stores across multiple browser tabs

const channels: Map<string, BroadcastChannel> = new Map()

export function setupCrossTabSync<T>(
  storeName: string,
  getState: () => T,
  setState: (state: T) => void
) {
  // Create or get broadcast channel
  let channel = channels.get(storeName)
  if (!channel) {
    channel = new BroadcastChannel(`bytepad-${storeName}`)
    channels.set(storeName, channel)
  }

  // Listen for updates from other tabs
  channel.onmessage = (event) => {
    if (event.data?.type === 'SYNC' && event.data?.state) {
      setState(event.data.state)
    }
  }

  // Return function to broadcast changes
  return () => {
    channel?.postMessage({
      type: 'SYNC',
      state: getState(),
      timestamp: Date.now()
    })
  }
}

// Simple hook to trigger sync after state changes
export function broadcastStateChange(storeName: string, state: unknown) {
  const channel = channels.get(storeName)
  if (channel) {
    channel.postMessage({
      type: 'SYNC',
      state,
      timestamp: Date.now()
    })
  }
}
