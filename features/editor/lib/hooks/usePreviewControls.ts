/**
 * ============================================================================
 * PREVIEW CONTROLS HOOK
 * ============================================================================
 * 
 * Manages preview view mode and zoom controls for the document preview.
 * 
 * WHAT IT DOES:
 *   - Manages view mode (page vs fluid layout)
 *   - Manages zoom presets (50%, 75%, 100%, 125%, 150%, 200%)
 *   - Manages watermark visibility
 * 
 * USED BY:
 *   - PreviewWorkspace.tsx - Main preview component
 *   - Preview controls UI (zoom buttons, view mode toggle, watermark toggle)
 * 
 * STATE:
 *   - viewMode: 'page' | 'fluid' - Layout mode
 *   - zoomPreset: '50' | '75' | '100' | '125' | '150' | '200' - Zoom level
 *   - showWatermark: boolean - Whether to show watermark
 * 
 * RETURNS:
 *   - viewMode, setViewMode
 *   - zoomPreset, setZoomPreset
 *   - showWatermark, setShowWatermark
 * ============================================================================
 */

import { useState } from 'react';

type ZoomPreset = '50' | '75' | '100' | '125' | '150' | '200';

export function usePreviewControls() {
  const [viewMode, setViewMode] = useState<'page' | 'fluid'>('page');
  const [zoomPreset, setZoomPreset] = useState<ZoomPreset>('100');
  const [showWatermark, setShowWatermark] = useState(true);

  return {
    viewMode,
    setViewMode,
    zoomPreset,
    setZoomPreset,
    showWatermark,
    setShowWatermark,
  };
}
