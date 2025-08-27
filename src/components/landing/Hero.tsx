import { motion } from "framer-motion"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Hero() {
  return (
    <section className="relative flex flex-col items-center text-center py-24 bg-gradient-to-b from-blue-50 to-white">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-4xl md:text-6xl font-bold mb-6">
          Freedom starts with a clear plan — let’s build yours.
        </h1>
        <p className="text-lg md:text-xl text-gray-600 mb-8">
          Whether you need funding, a visa, or a growth-ready business plan.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/reco">
            <Button size="lg">Find Funding</Button>
          </Link>
          <Link href="/plan">
            <Button size="lg" variant="outline">Generate Business Plan</Button>
          </Link>
        </div>
      </motion.div>
    </section>
  )
}
