import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export function ExportPanel() {
  const handleExport = () => {
    alert('Export functionality will be connected here.');
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, ease: 'easeInOut' }}>
      <Card className="p-6 text-center shadow-lg">
        <h2 className="text-xl font-semibold mb-4">Export Your Plan</h2>
        <Button onClick={handleExport}>Download PDF</Button>
      </Card>
    </motion.div>
  );
}
