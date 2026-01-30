import { useTranslation } from '../../i18n';
import type { ReleaseInfo } from '../../services/updateService';

interface UpdateBannerProps {
  releaseInfo: ReleaseInfo;
  currentVersion: string;
  onViewRelease: () => void;
  onDismiss: () => void;
}

export function UpdateBanner({ releaseInfo, currentVersion, onViewRelease, onDismiss }: UpdateBannerProps) {
  const { t } = useTranslation();

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 animate-slide-up">
      <div className="bg-np-blue/95 backdrop-blur-sm text-white px-4 py-3 rounded-lg shadow-lg max-w-lg">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="flex-shrink-0 mt-0.5">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-semibold">
                {t('update.newVersionAvailable') || 'New version available'}
              </span>
              <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded">
                v{releaseInfo.version}
              </span>
            </div>
            <p className="text-xs text-white/80 mb-2">
              {t('update.currentVersion') || 'Current'}: v{currentVersion}
            </p>
            {releaseInfo.name && (
              <p className="text-xs text-white/90 truncate">
                {releaseInfo.name}
              </p>
            )}
          </div>

          {/* Dismiss button */}
          <button
            onClick={onDismiss}
            className="flex-shrink-0 text-white/60 hover:text-white p-1 -mt-1 -mr-1 transition-colors"
            aria-label="Dismiss"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/20">
          <button
            onClick={onViewRelease}
            className="flex-1 bg-white text-np-blue px-3 py-1.5 rounded text-sm font-medium hover:bg-white/90 transition-colors flex items-center justify-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            {t('update.viewRelease') || 'View Release'}
          </button>
          <button
            onClick={onDismiss}
            className="px-3 py-1.5 rounded text-sm text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            {t('update.later') || 'Later'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default UpdateBanner;
