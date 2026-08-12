import React from 'react';
import { useMediaUpload } from '../../hooks/useMediaUpload';
import { Loader2, X, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

export const UploadQueueBanner: React.FC = () => {
  const { activeUploads, uploadQueue, cancelUpload, retryUpload, clearCompleted } =
    useMediaUpload();

  if (uploadQueue.length === 0) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-24 md:right-auto md:w-96 z-40 bg-slate-900/95 border border-slate-700 text-white rounded-2xl p-3 shadow-2xl backdrop-blur-md space-y-2 animate-in slide-in-from-bottom-5 duration-200">
      <div className="flex items-center justify-between text-xs font-bold border-b border-slate-800 pb-2">
        <span className="flex items-center gap-2">
          {activeUploads.length > 0 ? (
            <Loader2 className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
          ) : (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          )}
          <span>
            {activeUploads.length > 0
              ? `Uploading ${activeUploads.length} media file(s)`
              : 'Media Uploads Complete'}
          </span>
        </span>

        {activeUploads.length === 0 && (
          <button
            onClick={clearCompleted}
            className="text-[10px] text-slate-400 hover:text-white underline"
          >
            Clear
          </button>
        )}
      </div>

      <div className="max-h-40 overflow-y-auto space-y-2 divide-y divide-slate-800/60 text-xs">
        {uploadQueue.map((item) => (
          <div key={item.uploadId} className="pt-2 first:pt-0 space-y-1">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate font-semibold text-slate-200 max-w-[200px]">
                {item.fileName}
              </span>

              <div className="flex items-center gap-2 shrink-0">
                <span className="font-mono text-[10px] text-slate-400">
                  {item.progress}%
                </span>

                {item.status === 'failed' && (
                  <button
                    onClick={() => retryUpload(item.uploadId)}
                    className="p-1 rounded bg-amber-500/20 text-amber-400 hover:bg-amber-500/30"
                    title="Retry Upload"
                  >
                    <RefreshCw className="w-3 h-3" />
                  </button>
                )}

                {(item.status === 'uploading' || item.status === 'preparing') && (
                  <button
                    onClick={() => cancelUpload(item.uploadId)}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
                    title="Cancel Upload"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  item.status === 'failed'
                    ? 'bg-rose-500'
                    : item.status === 'completed'
                    ? 'bg-emerald-500'
                    : 'bg-emerald-400 animate-pulse'
                }`}
                style={{ width: `${item.progress}%` }}
              />
            </div>

            {item.statusText && (
              <p className="text-[10px] text-slate-400 truncate">{item.statusText}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
