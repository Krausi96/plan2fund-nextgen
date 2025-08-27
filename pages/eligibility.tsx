import { motion } from 'framer-motion';
import AppShell from "@/components/layout/AppShell"
import Eligibility from "@/components/reco/eligibility"

export default function EligibilityPage() {
  return (
    <AppShell breadcrumb={['Home','Eligibility']}>
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4, ease: 'easeInOut' }}>
      <div className="p-6">
        <Eligibility status="pending" onCheck={() => {}} />
      </div>
        </motion.div>
</AppShell>
  )
}




