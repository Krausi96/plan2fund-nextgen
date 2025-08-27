import { useRef } from 'react';
import { Button } from '@/components/ui/button';

export interface DocsUploadProps {
  onUpload: (file: File) => void;
}

export function DocsUpload({ onUpload }: DocsUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="space-y-2">
      <input
        type="file"
        ref={inputRef}
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            onUpload(e.target.files[0]);
          }
        }}
      />
      <Button onClick={() => inputRef.current?.click()}>
        Upload Documents
      </Button>
    </div>
  );
}
