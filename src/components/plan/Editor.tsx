import { useState } from "react";
import Link from "next/link";

export default function Editor() {
  const [content, setContent] = useState("");

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Business Plan Editor</h1>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Start writing your plan..."
        className="w-full h-64 p-4 border rounded-md"
      />
      <div className="flex justify-end mt-4">
        <Link
          href="/review"
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Continue to Review
        </Link>
      </div>
    </div>
  );
}
