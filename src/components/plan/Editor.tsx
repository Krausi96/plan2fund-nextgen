import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function Editor() {
  const [content, setContent] = useState("Start drafting your business plan...");

  return (
    <Card className='p-4 space-y-4' className="p-4 space-y-4">
      <textarea
        className="w-full h-48 p-2 border rounded-md"
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
      <Button onClick={() => alert("Autosaved!")}>Save Draft</Button>
    </Card>
  );
}
