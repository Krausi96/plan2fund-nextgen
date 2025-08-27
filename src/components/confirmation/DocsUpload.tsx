import { useState } from "react";

type DocsUploadProps = {
  onUpload?: (file: File) => void;
};

export default function DocsUpload({ onUpload }: DocsUploadProps) {
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFileName(file.name);
      onUpload?.(file);
    }
  };

  return (
    <div className="p-4 border rounded bg-gray-50 cursor-pointer">
      <label className="block cursor-pointer">
        <input
          type="file"
          className="hidden"
          onChange={handleFileChange}
        />
        {fileName ? (
          <span className="text-sm text-gray-700">Uploaded: {fileName}</span>
        ) : (
          <span className="text-sm text-gray-500">Click to Upload Supporting Docs</span>
        )}
      </label>
    </div>
  );
}
