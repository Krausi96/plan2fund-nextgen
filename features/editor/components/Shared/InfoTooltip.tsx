import React from 'react';

interface InfoTooltipProps {
  title: string;
  content: string;
}

/**
 * InfoTooltip component
 * Displays an info icon with a tooltip on hover
 */
export function InfoTooltip({ title, content }: InfoTooltipProps) {
  return (
    <div className="relative group inline-flex items-center">
      <div className="w-4 h-4 rounded-full bg-blue-500/30 border border-blue-400/50 flex items-center justify-center cursor-help text-[10px] text-blue-300 hover:bg-blue-500/50 transition-colors">
        ℹ️
      </div>
      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-xs text-white opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50 shadow-xl">
        <div className="font-semibold mb-1 text-white">{title}</div>
        <div className="text-white/80 leading-relaxed whitespace-normal">{content}</div>
        {/* Arrow */}
        <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-700"></div>
      </div>
    </div>
  );
}

