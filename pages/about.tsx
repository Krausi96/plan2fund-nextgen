import { Info, FileText, Scale, Eye } from "lucide-react";
import { motion } from "framer-motion";

export default function About() {
  return (
    <main className="bg-white">
      <section className="py-20 text-center bg-gradient-to-b from-gray-50 to-white">
        <h1 className="text-5xl font-bold mb-4">About Us</h1>
        <p className="text-lg text-gray-600">
          Helping businesses succeed through clear planning and funding expertise.
        </p>
      </section>
      <section className="max-w-3xl mx-auto py-12 space-y-12 px-4">
        <motion.div
          className="flex items-start space-x-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Info className="h-8 w-8 text-blue-500" />
          <div>
            <h2 className="text-2xl font-semibold">Our Mission</h2>
            <p className="text-gray-600">
              We empower entrepreneurs with tools and guidance to build funding-ready business plans.
            </p>
          </div>
        </motion.div>
        <motion.div
          className="flex items-start space-x-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <FileText className="h-8 w-8 text-green-500" />
          <div>
            <h2 className="text-2xl font-semibold">Our Expertise</h2>
            <p className="text-gray-600">
              With deep experience in startup funding, we’ve supported successful applications for grants, visas, and investments.
            </p>
          </div>
        </motion.div>
        <motion.div
          className="flex items-start space-x-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Scale className="h-8 w-8 text-purple-500" />
          <div>
            <h2 className="text-2xl font-semibold">Our Values</h2>
            <p className="text-gray-600">
              Transparency, integrity, and founder-first thinking guide everything we do.
            </p>
          </div>
        </motion.div>
        <motion.div
          className="flex items-start space-x-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <Eye className="h-8 w-8 text-pink-500" />
          <div>
            <h2 className="text-2xl font-semibold">Our Vision</h2>
            <p className="text-gray-600">
              To make funding accessible to every entrepreneur, by combining technology with deep expertise.
            </p>
          </div>
        </motion.div>
      </section>
    </main>
  );
}
