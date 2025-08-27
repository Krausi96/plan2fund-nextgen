import AppShell from '@/components/layout/AppShell';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

export default function ThanksPage() {
  return (
    <AppShell breadcrumb={['Home', 'Thanks']}>
      <motion.div
        className="text-center p-8"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeInOut' }}
      >
        <h1 className="text-2xl font-bold mb-4">?? Thank You!</h1>
        <p className="text-gray-600 mb-6">Your plan has been created successfully.</p>
        <Button asChild>
          <a href="/">Start a New Plan</a>
        </Button>
      </motion.div>
    </AppShell>
  );
}
