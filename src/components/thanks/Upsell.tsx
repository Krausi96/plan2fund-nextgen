import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Upsell() {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Upgrade Your Experience</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4">
          Get 1-on-1 coaching and access to premium plan templates tailored for
          investors, accelerators, and grants.
        </p>
        <Button asChild>
          <a href="/pricing">Explore Premium Plans</a>
        </Button>
      </CardContent>
    </Card>
  );
}
