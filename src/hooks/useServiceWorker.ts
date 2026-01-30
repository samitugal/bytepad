import { useState, useEffect, useCallback } from 'react';

interface ServiceWorkerState {
  isSupported: boolean;
  isRegistered: boolean;
  isUpdateAvailable: boolean;
  isOffline: boolean;
  registration: ServiceWorkerRegistration | null;
  waitingWorker: ServiceWorker | null;
}

interface UseServiceWorkerReturn extends ServiceWorkerState {
  updateApp: () => void;
  checkForUpdates: () => Promise<void>;
}

export function useServiceWorker(): UseServiceWorkerReturn {
  const [state, setState] = useState<ServiceWorkerState>({
    isSupported: 'serviceWorker' in navigator,
    isRegistered: false,
    isUpdateAvailable: false,
    isOffline: !navigator.onLine,
    registration: null,
    waitingWorker: null,
  });

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => setState((s) => ({ ...s, isOffline: false }));
    const handleOffline = () => setState((s) => ({ ...s, isOffline: true }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Register service worker and handle updates
  useEffect(() => {
    if (!state.isSupported) return;

    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('[App] SW registered:', registration.scope);

        setState((s) => ({
          ...s,
          isRegistered: true,
          registration,
        }));

        // Check if there's already a waiting worker
        if (registration.waiting) {
          setState((s) => ({
            ...s,
            isUpdateAvailable: true,
            waitingWorker: registration.waiting,
          }));
        }

        // Listen for new service worker installing
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          console.log('[App] New SW installing...');

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New SW installed, waiting to activate
              console.log('[App] New SW installed, update available');
              setState((s) => ({
                ...s,
                isUpdateAvailable: true,
                waitingWorker: newWorker,
              }));
            }
          });
        });

        // Handle controller change (after skipWaiting)
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          console.log('[App] Controller changed, reloading...');
          window.location.reload();
        });
      } catch (error) {
        console.error('[App] SW registration failed:', error);
      }
    };

    registerSW();
  }, [state.isSupported]);

  // Update the app by telling the waiting worker to skip waiting
  const updateApp = useCallback(() => {
    const { waitingWorker } = state;
    if (!waitingWorker) return;

    console.log('[App] Sending SKIP_WAITING to SW');
    waitingWorker.postMessage({ type: 'SKIP_WAITING' });
  }, [state.waitingWorker]);

  // Manually check for updates
  const checkForUpdates = useCallback(async () => {
    const { registration } = state;
    if (!registration) return;

    try {
      await registration.update();
      console.log('[App] Checked for updates');
    } catch (error) {
      console.error('[App] Update check failed:', error);
    }
  }, [state.registration]);

  return {
    ...state,
    updateApp,
    checkForUpdates,
  };
}

export default useServiceWorker;
