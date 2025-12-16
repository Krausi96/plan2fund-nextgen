import React from 'react';

interface InfoTooltipProps {
  title: string;
  content: string;
}

/**
 * InfoTooltip component
 * Simple tooltip for displaying information
 */
export function InfoTooltip({ title, content }: InfoTooltipProps) {
  return (
    <div className="relative group inline-block">
      <span className="text-xs text-white/60 cursor-help">ℹ️</span>
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-50">
        <div className="bg-slate-900 text-white text-xs rounded-lg p-2 shadow-lg max-w-xs border border-white/20">
          <div className="font-semibold mb-1">{title}</div>
          <div className="text-white/80">{content}</div>
        </div>
      </div>
    </div>
  );
}
