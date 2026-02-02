import React, { useState } from 'react';
import { useI18n } from '@/shared/contexts/I18nContext';
import { parseProgramFromUrl } from '@/features/editor/lib';

interface UrlParserProps {
  onProgramSelect: (program: any) => void;
  onBackToFinder?: () => void;
}

export function UrlParser({ onProgramSelect, onBackToFinder }: UrlParserProps) {
  const { t } = useI18n();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUrlParse = async () => {
    if (!url.trim()) {
      setError(t('editor.desktop.program.pasteUrlPlaceholder' as any) || 'Please enter a valid URL');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Parse program information using external utility
      const parsedProgram = await parseProgramFromUrl(url.trim());
      
      if (parsedProgram) {
        onProgramSelect(parsedProgram);
      } else {
        setError(t('editor.desktop.program.urlParsingFailed' as any) || 'Could not extract program information from this URL. Please try a different funding program URL.');
      }
    } catch (err: any) {
      setError(err.message || t('editor.desktop.program.urlParsingError' as any) || 'Failed to parse URL. Please check the URL format and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleUrlParse();
  };

  return (
    <div>
      <div className="bg-slate-800/50 rounded-lg p-4 border border-white/10 mb-4">
        <p className="text-white/70 text-sm mb-3">
          {t('editor.desktop.program.pasteUrlDescription' as any) || 'Enter the official program URL to automatically load requirements'}
        </p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={t('editor.desktop.program.pasteUrlPlaceholder' as any) || 'https://www.aws.at/funding/...'}
              className="flex-1 rounded border border-white/30 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400/60"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white text-sm rounded-lg transition-colors whitespace-nowrap"
            >
              {loading ? (
                <span>{t('editor.desktop.program.loading' as any) || 'Loading...'}</span>
              ) : (
                <span>{t('editor.desktop.program.loadProgram' as any) || 'Load Program'}</span>
              )}
            </button>
          </div>
        </form>
        
        {error && (
          <div className="mt-3 p-2 bg-red-900/50 border border-red-700 rounded text-red-200 text-sm">
            {error}
          </div>
        )}
      </div>

      {onBackToFinder && (
        <div className="text-right">
          <button
            onClick={onBackToFinder}
            className="px-3 py-1 text-white/80 hover:text-white text-sm transition-colors inline-flex items-center gap-1"
          >
            <span>←</span>
            <span>{t('editor.desktop.program.backToFinder' as any) || 'Back to Program Finder'}</span>
          </button>
        </div>
      )}
    </div>
  );
}