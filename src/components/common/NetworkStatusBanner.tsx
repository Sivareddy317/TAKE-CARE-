import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, CheckCircle2, Clock } from 'lucide-react';
import { offlineSync } from '../../services/offlineSyncService';

export const NetworkStatusBanner: React.FC = () => {
  const [status, setStatus] = useState(offlineSync.getStatus());

  useEffect(() => {
    return offlineSync.subscribe((s) => setStatus(s));
  }, []);

  const formatLastSynced = (timestamp: number | null): string => {
    if (!timestamp) return 'Never synced';
    const diffSec = Math.floor((Date.now() - timestamp) / 1000);
    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    return `${Math.floor(diffSec / 3600)}h ago`;
  };

  // If online and no queued changes, keep banner discreet / minimal
  if (status.isOnline && status.queueLength === 0 && !status.isSyncing) {
    return null;
  }

  return (
    <div
      className={`w-full px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-2 border-b transition-colors ${
        !status.isOnline
          ? 'bg-amber-500/15 border-amber-300 text-amber-900'
          : status.isSyncing
          ? 'bg-sky-500/15 border-sky-300 text-sky-900'
          : 'bg-emerald-500/15 border-emerald-300 text-emerald-900'
      }`}
    >
      <div className="flex items-center gap-2 font-medium">
        {!status.isOnline ? (
          <>
            <WifiOff className="w-4 h-4 text-amber-700 shrink-0" />
            <span>
              <strong>Working Offline</strong> — Your data is safe locally.{' '}
              {status.queueLength > 0 && `${status.queueLength} change(s) queued for sync.`}
            </span>
          </>
        ) : status.isSyncing ? (
          <>
            <RefreshCw className="w-4 h-4 text-sky-700 animate-spin shrink-0" />
            <span>Syncing pending health updates with server...</span>
          </>
        ) : (
          <>
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>Connected &amp; Synchronized</span>
          </>
        )}
      </div>

      <div className="flex items-center gap-3 text-[11px] text-slate-600">
        <span className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          Last synced: {formatLastSynced(status.lastSyncedAt)}
        </span>

        {status.isOnline && status.queueLength > 0 && (
          <button
            type="button"
            onClick={() => offlineSync.drainQueue()}
            className="px-2.5 py-0.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold transition cursor-pointer"
          >
            Sync Now
          </button>
        )}
      </div>
    </div>
  );
};
