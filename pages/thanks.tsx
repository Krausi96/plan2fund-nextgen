import { motion } from 'framer-motion';
import AppShell from "@/components/layout/AppShell"
import RevisionRequest from "@/components/thanks/RevisionRequest"
import Upsell from "@/components/thanks/Upsell"

export default function thanks() {
  return (
    <AppShell breadcrumb={['Home','thanks']}>
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4, ease: 'easeInOut' }}>
      
  return (
    <div className="max-w-3xl mx-auto py-10 space-y-6 text-center">
      <h1 className="text-2xl font-bold">Thank You!</h1>
      <p>Your plan has been generated and a confirmation email has been sent.</p>
      <RevisionRequest />
      <Upsell />
    </div>
  )

        </motion.div>
</AppShell>
  )
}





