import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import { Shield, X, Bug } from 'lucide-react';

export const AuthDiagnosticsOverlay: React.FC = () => {
  const { diagnostics, isAuthenticated, isLoadingAuth } = useUser();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isDebugUrl, setIsDebugUrl] = useState(false);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const hasDebugParam = searchParams.get('debug') === 'true';
    setIsDebugUrl(hasDebugParam);
    if (hasDebugParam) {
      setIsOpen(true);
    }
  }, [location.search]);

  if (!isDebugUrl && !isOpen) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm w-full font-mono text-xs">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-900/90 text-amber-400 border border-amber-500/30 backdrop-blur-md shadow-xl hover:bg-zinc-800 cursor-pointer"
        >
          <Bug size={14} />
          <span>Auth Diagnostics</span>
        </button>
      ) : (
        <div className="p-4 rounded-2xl bg-zinc-950/95 text-zinc-200 border border-zinc-800 shadow-2xl backdrop-blur-xl space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs">
              <Shield size={14} />
              <span>AUTH DIAGNOSTICS</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>

          <div className="space-y-1.5 text-[11px]">
            <div className="flex justify-between">
              <span className="text-zinc-400">Auth Status:</span>
              <span className={`font-bold ${isAuthenticated ? 'text-emerald-400' : isLoadingAuth ? 'text-amber-400' : 'text-zinc-400'}`}>
                {diagnostics.authStatus}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-zinc-400">Authenticated:</span>
              <span className="font-bold text-white">{isAuthenticated ? 'YES' : 'NO'}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-zinc-400">Auth UUID:</span>
              <span className="text-zinc-300 truncate max-w-[170px]" title={diagnostics.authUserId || 'None'}>
                {diagnostics.authUserId ? `${diagnostics.authUserId.slice(0, 8)}...` : 'None'}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-zinc-400">Masked Email:</span>
              <span className="text-zinc-300">{diagnostics.maskedEmail || 'Unauthenticated'}</span>
            </div>

            <div className="h-px bg-zinc-800/80 my-1" />

            <div className="flex justify-between">
              <span className="text-zinc-400">Profile Row:</span>
              <span className={`font-bold ${diagnostics.profileExists ? 'text-emerald-400' : 'text-rose-400'}`}>
                {diagnostics.profileExists ? 'EXISTS' : 'MISSING'}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-zinc-400">Onboarding State:</span>
              <span className={`font-bold ${diagnostics.onboardingComplete ? 'text-emerald-400' : 'text-amber-400'}`}>
                {diagnostics.onboardingComplete ? 'COMPLETE' : 'INCOMPLETE'}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-zinc-400">Sync Mutex:</span>
              <span className="text-zinc-300 font-semibold">{diagnostics.profileSyncState}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-zinc-400">Last Event:</span>
              <span className="text-purple-400 font-semibold">{diagnostics.lastAuthEvent}</span>
            </div>
          </div>

          <div className="pt-1 border-t border-zinc-800/80 text-[10px] text-zinc-500 text-center">
            Zero token or secret exposure guaranteed
          </div>
        </div>
      )}
    </div>
  );
};
