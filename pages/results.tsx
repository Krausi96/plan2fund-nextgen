import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/router";

const mockResults = [
  { name: "AWS PreSeed", match: "85%", eligible: true },
  { name: "FFG Basisprogramm", match: "72%", eligible: true },
  { name: "EU Startup Call", match: "60%", eligible: false },
  { name: "Bank Loan SME", match: "55%", eligible: true },
  { name: "Vienna Business Agency", match: "50%", eligible: true },
];

export default function ResultsPage() {
  const router = useRouter();
  const answers = router.query;

  return (
    <div className="max-w-4xl mx-auto py-12 space-y-8">
      <h1 className="text-2xl font-bold text-center">Top Matches for You</h1>
      <div className="grid md:grid-cols-2 gap-6">
        {mockResults.map((r, idx) => (
          <motion.div
            key={r.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.2 }}
            className="border rounded-2xl p-6 shadow-sm bg-white"
          >
            <h3 className="font-bold text-lg">{r.name}</h3>
            <p className="text-sm text-gray-500">Match: {r.match}</p>
            <span className={`text-sm font-semibold ${r.eligible ? "text-green-600" : "text-red-600"}`}>
              {r.eligible ? "✅ Eligible" : "❌ Not Eligible"}
            </span>
            <div className="mt-4">
              <Button asChild>
                <Link href="/plan">Continue to Plan Generator</Link>
              </Button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
