import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Teaser() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    setSubmitted(true);
  };

  return (
    <Card className="max-w-xl mx-auto shadow-md">
      <CardHeader>
        <CardTitle>🚀 AI Plan Machine (Coming Soon)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-gray-600">
          The NextGen AI Business Plan Machine is under development. 
          Be the first to get access when we launch.
        </p>

        {submitted ? (
          <p className="text-green-600 font-medium">
            ✅ Thanks! You&apos;re on the waitlist.
          </p>
        ) : (
          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="flex-1 border rounded-md p-2"
            />
            <Button disabled={!email} onClick={handleSubmit}>
              Join Waitlist
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
