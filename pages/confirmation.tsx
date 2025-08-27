import { motion } from "framer-motion";
import AppShell from "@/components/layout/AppShell";

export default function Confirmation() {
  return (
    <AppShell breadcrumb={[{ label: "Home", href: "/" }, { label: "Confirmation" }]}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
      >
        <h2 className="text-2xl font-bold mb-4">Confirmation</h2>
        {/* Confirmation components here */}
      </motion.div>
    </AppShell>
  );
}
