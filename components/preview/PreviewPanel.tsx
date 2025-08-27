import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';

export function PreviewPanel() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: 'easeInOut' }}>
      <Card className="p-6 space-y-4 shadow-lg">
        <h2 className="text-xl font-semibold">Your Business Plan Preview</h2>
        <p className="text-gray-600">Here’s a quick look at your generated content before checkout.</p>
      </Card>
    </motion.div>
  );
}
