import { motion } from "framer-motion";
import { Lightbulb, Target, Users } from "lucide-react";

export default function About() {
  return (
    <main className="max-w-5xl mx-auto px-6 py-16 space-y-16">
      <section className="text-center space-y-6">
        <h1 className="text-4xl font-bold">About Plan2Fund</h1>
        <p className="text-lg text-gray-600">
          Plan2Fund helps entrepreneurs and businesses create professional business plans
          and connect with funding opportunities quickly and reliably.
        </p>
      </section>

      <motion.section
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="grid md:grid-cols-3 gap-10 text-center"
      >
        <div className="space-y-3">
          <Lightbulb className="w-10 h-10 mx-auto text-blue-600" />
          <h3 className="font-semibold text-xl">Our Mission</h3>
          <p className="text-gray-600">
            To empower founders by simplifying planning and funding processes.
          </p>
        </div>
        <div className="space-y-3">
          <Target className="w-10 h-10 mx-auto text-blue-600" />
          <h3 className="font-semibold text-xl">Our Vision</h3>
          <p className="text-gray-600">
            A world where every great idea can find the right support to thrive.
          </p>
        </div>
        <div className="space-y-3">
          <Users className="w-10 h-10 mx-auto text-blue-600" />
          <h3 className="font-semibold text-xl">Our Values</h3>
          <p className="text-gray-600">
            Transparency, innovation, and accessibility for all entrepreneurs.
          </p>
        </div>
      </motion.section>
    </main>
  );
}
