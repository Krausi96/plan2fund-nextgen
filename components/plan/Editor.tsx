import { useState, useEffect } from 'react';

export interface EditorProps {
  onChange?: (val: string) => void;
  autosave?: boolean;
}

export default function Editor({ onChange, autosave = true }: EditorProps) {
  const [content, setContent] = useState<string>(() => {
    if (typeof window !== 'undefined' && autosave) {
      return localStorage.getItem('plan-editor') || '';
    }
    return '';
  });

  useEffect(() => {
    if (autosave) {
      localStorage.setItem('plan-editor', content);
    }
    if (onChange) {
      onChange(content);
    }
  }, [content, autosave, onChange]);

  return (
    <div className="p-4 border rounded-xl">
      <textarea
        className="w-full h-80 border p-3 rounded-lg"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Start writing your business plan..."
      />
      {autosave && (
        <p className="text-xs text-gray-400 mt-2">Autosaved locally</p>
      )}
    </div>
  );
}
