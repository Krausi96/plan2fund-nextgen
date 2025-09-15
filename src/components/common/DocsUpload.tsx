import { useState } from "react";

type DocsUploadProps = {
  onUpload?: (files: File[]) => void;
};

export default function DocsUpload({ onUpload }: DocsUploadProps) {
  const [fileNames, setFileNames] = useState<string[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setFileNames(files.map((f) => f.name));
      onUpload?.(files);
    }
  };

  return (
    <div className="p-4 border rounded bg-gray-50 cursor-pointer">
      <label className="block cursor-pointer">
        <input
          type="file"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
        {fileNames.length > 0 ? (
          <ul className="text-sm text-gray-700 list-disc pl-5">
            {fileNames.map((name, i) => (
              <li key={i}>{name}</li>
            ))}
          </ul>
        ) : (
          <span className="text-sm text-gray-500">
            Click to Upload Supporting Documents
          </span>
        )}
      </label>
    </div>
  );
}

