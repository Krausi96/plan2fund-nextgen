import React, { useState, useRef } from 'react';

interface LivePreviewBoxProps {
  formData: {
    title: string;
    subtitle: string;
    companyName: string;
    legalForm: string;
    contactInfo?: {
      email?: string;
      phone?: string;
      website?: string;
      address?: string;
    };
  };
}

const LivePreviewBox: React.FC<LivePreviewBoxProps> = ({ formData }) => {
  // Calculate A4 aspect ratio (210mm × 297mm)
  const a4Ratio = 210 / 297;
  const boxWidth = 320; // w-80 = 20rem = 320px
  const calculatedHeight = boxWidth / a4Ratio;
  
  const hasPreviewData = formData.title || formData.companyName || formData.subtitle || formData.legalForm;
  
  // Window state
  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState({ x: window.innerWidth - boxWidth - 16, y: window.innerHeight - calculatedHeight - 16 });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  
  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragOffset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
    e.preventDefault();
  };
  
  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      const newX = e.clientX - dragOffset.current.x;
      const newY = e.clientY - dragOffset.current.y;
      
      // Keep within viewport bounds
      const boundedX = Math.max(16, Math.min(window.innerWidth - boxWidth - 16, newX));
      const boundedY = Math.max(16, Math.min(window.innerHeight - calculatedHeight - 16, newY));
      
      setPosition({ x: boundedX, y: boundedY });
    }
  };
  
  const handleMouseUp = () => {
    setIsDragging(false);
  };
  
  // Add/remove mouse listeners
  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  return (
    <div 
      className={`relative bg-slate-800/95 backdrop-blur-sm rounded-lg border border-slate-600 shadow-xl transition-all duration-300 ${isDragging ? 'cursor-grabbing' : 'hover:scale-[1.01]'} w-full`} 
      style={{ 
        height: isMinimized ? '40px' : '100%',
      }}
    >
      {/* Window Header with Controls */}
      <div 
        className="flex items-center justify-between p-2 bg-slate-700 rounded-t-lg cursor-move select-none"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2">
          <h3 className="text-white font-medium text-sm">📄 Live Preview</h3>
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
        </div>
          
        {/* Window Controls */}
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setIsMinimized(!isMinimized)}
            className="w-6 h-6 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 rounded transition-colors"
            title={isMinimized ? 'Expand' : 'Minimize'}
          >
            {isMinimized ? '□' : '−'}
          </button>
          <button 
            onClick={() => {
              // Close functionality - could hide the component or minimize to tray
              setIsMinimized(true);
            }}
            className="w-6 h-6 flex items-center justify-center text-white/70 hover:text-white hover:bg-red-500/20 rounded transition-colors"
            title="Close"
          >
            ×
          </button>
        </div>
      </div>
        
      {/* Content (only show when not minimized) */}
      {!isMinimized && (
        <div className="p-3 h-full flex flex-col">
          {/* A4 Page Simulation */}
          <div className="flex-1 bg-white rounded border border-gray-300 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-white opacity-50"></div>
            <div className="relative p-4 h-full overflow-y-auto">
              <div className="min-h-full flex flex-col justify-between">
                {/* Header Section */}
                <div>
                  {formData.title && (
                    <div className="mb-2">
                      <h1 className="text-2xl font-bold text-gray-900 text-center">{formData.title}</h1>
                    </div>
                  )}
                    
                  {formData.subtitle && (
                    <div className="mb-4">
                      <h2 className="text-lg text-gray-600 text-center italic">{formData.subtitle}</h2>
                    </div>
                  )}
                    
                  {(formData.companyName || formData.legalForm) && (
                    <div className="mb-6 text-center">
                      <div className="text-xl font-semibold text-gray-800">
                        {formData.companyName}{formData.legalForm ? ` (${formData.legalForm})` : ''}
                      </div>
                    </div>
                  )}
                </div>
                  
                {/* Contact Information */}
                <div className="mt-auto">
                  <div className="border-t border-gray-300 pt-3">
                    <div className="text-sm text-gray-600 space-y-1">
                      {formData.contactInfo?.email && (
                        <div>📧 {formData.contactInfo.email}</div>
                      )}
                      {formData.contactInfo?.phone && (
                        <div>📞 {formData.contactInfo.phone}</div>
                      )}
                      {formData.contactInfo?.website && (
                        <div>🌐 {formData.contactInfo.website}</div>
                      )}
                      {formData.contactInfo?.address && (
                        <div>📍 {formData.contactInfo.address}</div>
                      )}
                    </div>
                  </div>
                </div>
                  
                {/* Empty state */}
                {!hasPreviewData && (
                  <div className="text-gray-400 text-center py-8">
                    <div className="text-lg mb-2">📄</div>
                    <div>Enter project details to see live preview</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LivePreviewBox;