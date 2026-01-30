import { useState, useEffect, useCallback } from 'react';
import {
  checkForUpdates,
  getCurrentVersion,
  dismissUpdate,
  isUpdateDismissed,
  ReleaseInfo,
} from '../services/updateService';

interface UseUpdateCheckReturn {
  isUpdateAvailable: boolean;
  releaseInfo: ReleaseInfo | null;
  currentVersion: string;
  isChecking: boolean;
  checkNow: () => Promise<void>;
  dismissCurrentUpdate: () => void;
  openReleasePage: () => void;
}

export function useUpdateCheck(): UseUpdateCheckReturn {
  const [releaseInfo, setReleaseInfo] = useState<ReleaseInfo | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  const currentVersion = getCurrentVersion();

  // Check for updates on mount and periodically
  useEffect(() => {
    const check = async () => {
      setIsChecking(true);
      try {
        const release = await checkForUpdates();
        if (release) {
          setReleaseInfo(release);
          setIsDismissed(isUpdateDismissed(release.version));
        }
      } finally {
        setIsChecking(false);
      }
    };

    // Initial check after a short delay
    const initialTimer = setTimeout(check, 5000);

    // Periodic check every 4 hours
    const intervalTimer = setInterval(check, 4 * 60 * 60 * 1000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(intervalTimer);
    };
  }, []);

  // Manual check
  const checkNow = useCallback(async () => {
    setIsChecking(true);
    try {
      const release = await checkForUpdates(true);
      if (release) {
        setReleaseInfo(release);
        setIsDismissed(isUpdateDismissed(release.version));
      } else {
        setReleaseInfo(null);
      }
    } finally {
      setIsChecking(false);
    }
  }, []);

  // Dismiss current update
  const dismissCurrentUpdate = useCallback(() => {
    if (releaseInfo) {
      dismissUpdate(releaseInfo.version);
      setIsDismissed(true);
    }
  }, [releaseInfo]);

  // Open release page in browser
  const openReleasePage = useCallback(() => {
    if (releaseInfo?.htmlUrl) {
      window.open(releaseInfo.htmlUrl, '_blank', 'noopener,noreferrer');
    }
  }, [releaseInfo]);

  const isUpdateAvailable = !!releaseInfo && !isDismissed;

  return {
    isUpdateAvailable,
    releaseInfo,
    currentVersion,
    isChecking,
    checkNow,
    dismissCurrentUpdate,
    openReleasePage,
  };
}

export default useUpdateCheck;
