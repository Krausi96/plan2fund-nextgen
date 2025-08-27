import Breadcrumbs from "@/components/layout/Breadcrumbs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function PreviewPage() {
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-10">
      <Breadcrumbs />

      <h1 className="text-2xl font-bold">Preview Your Plan</h1>
      <p className="text-gray-600">
        Here is a blurred preview of your generated plan. To unlock the full content,
        please choose a plan below.
      </p>

      {/* Blurred Content Preview */}
      <div className="border rounded-lg p-6 bg-white shadow-sm overflow-hidden relative">
        <div className="blur-sm select-none">
          <h2 className="text-lg font-semibold mb-2">Executive Summary</h2>
          <p className="text-gray-700">
            [This is a blurred preview of your business plan. Upgrade to unlock full access.]
          </p>
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="bg-white/70 px-4 py-2 rounded text-gray-600 font-medium shadow">
            Blurred Preview
          </span>
        </div>
      </div>

      {/* Pricing Options */}
      <section>
        <h2 className="text-xl font-semibold mb-6">Choose Your Plan</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="shadow-md">
            <CardContent className="p-6 flex flex-col space-y-4">
              <h3 className="text-lg font-bold">Standard</h3>
              <p className="text-gray-600 text-sm">Get the complete business plan in PDF or Word.</p>
              <p className="text-2xl font-bold">€49</p>
              <Button asChild>
                <Link href="/confirmation">Select Standard</Link>
              </Button>
            </CardContent>
          </Card>
          <Card className="shadow-md border-blue-500">
            <CardContent className="p-6 flex flex-col space-y-4">
              <h3 className="text-lg font-bold text-blue-600">Premium</h3>
              <p className="text-gray-600 text-sm">Includes Standard plan + Executive Summary + 1 revision.</p>
              <p className="text-2xl font-bold">€99</p>
              <Button asChild>
                <Link href="/confirmation">Select Premium</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
