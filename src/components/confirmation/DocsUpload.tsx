import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function DocsUpload() {
  const [files, setFiles] = useState<File[]>([]);

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  return (
    <Card className="mb-6 shadow-sm">
      <CardHeader>
        <CardTitle>Upload Additional Documents</CardTitle>
      </CardHeader>
      <CardContent>
        <input
          type="file"
          multiple
          onChange={handleFiles}
          className="mb-4"
        />
        <ul className="text-sm text-gray-600 mb-4">
          {files.map((file, idx) => (
            <li key={idx}>{file.name}</li>
          ))}
        </ul>
        <Button disabled={files.length === 0}>Upload (stub)</Button>
      </CardContent>
    </Card>
  );
}
