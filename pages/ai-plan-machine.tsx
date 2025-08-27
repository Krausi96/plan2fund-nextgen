import { motion } from 'framer-motion';
import AppShell from "@/components/layout/AppShell"

export default function AIPage() {
  return (
    <AppShell breadcrumb={["Home", "AI Plan Machine"]}>
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4, ease: 'easeInOut' }}>
      <div className="p-6">
        <h1 className="text-2xl font-bold">AI Plan Machine</h1>
        <p className="mt-2">Generate AI-powered business and funding insights.</p>
      </div>
        </motion.div>
</AppShell>
  )
}



