import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function RevisionRequest() {
  const [text, setText] = useState("");

  return (
    <Card className="mb-6 shadow-sm">
      <CardHeader>
        <CardTitle>Request a Revision</CardTitle>
      </CardHeader>
      <CardContent>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Describe what needs revision..."
          className="w-full h-24 border rounded-md p-2 mb-3"
        />
        <Button disabled={!text}>Submit Request (stub)</Button>
      </CardContent>
    </Card>
  );
}
