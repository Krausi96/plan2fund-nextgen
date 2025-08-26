import React from "react";
import { motion } from "framer-motion";
import { CheckCircle, Users, Briefcase, FileText, Target, DollarSign } from "lucide-react";

// --- NavBar ---
function NavBar() {
  const links = ["Find Funding", "Generate Plan", "Use Cases", "Pricing", "Contact"];
  return (
    <nav className="fixed top-0 left-0 w-full bg-white shadow z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <div className="text-2xl font-bold text-blue-600">Plan2Fund</div>
        <div className="hidden md:flex gap-8 text-gray-700 font-medium">
          {links.map((l, i) => (
            <a key={i} href={`#${l.toLowerCase().replace(/ /g, "-")}`} className="hover:text-blue-600 transition">
              {l}
            </a>
          ))}
        </div>
        <button className="ml-6 px-6 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition">
          Get Started
        </button>
      </div>
    </nav>
  );
}

// --- Floating Background Objects ---
function FlyingObjects() {
  const objects = ["📄", "🧾", "📘"];
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {objects.map((obj, i) => (
        <motion.div
          key={i}
          className="absolute text-4xl opacity-20"
          initial={{ y: Math.random() * 800, x: Math.random() * 800, rotate: 0 }}
          animate={{ y: [null, -200], rotate: 360 }}
          transition={{ duration: 20 + i * 5, repeat: Infinity, ease: "linear" }}
          style={{ left: `${20 + i * 30}%`, top: `${20 + i * 20}%` }}
        >
          {obj}
        </motion.div>
      ))}
    </div>
  );
}

// --- Hero Section ---
function Hero() {
  return (
    <section className="relative pt-40 pb-32 text-center bg-gradient-to-b from-blue-100 via-white to-white">
      <FlyingObjects />
      <motion.h1
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.9 }}
        className="text-5xl md:text-7xl font-bold text-gray-900 tracking-tight relative z-10"
      >
        📍 Freedom starts with a clear plan — let’s build yours.
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 1, delay: 0.3 }}
        className="mt-8 text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed relative z-10"
      >
        Whether you're shaping an idea, applying for funding or preparing a visa —
        we turn your thoughts, drafts or existing business into a submission &
        funding-ready Business Plan.
      </motion.p>
      <div className="mt-10 flex justify-center gap-6 relative z-10">
        <motion.button
          whileHover={{ scale: 1.05 }}
          className="px-8 py-4 rounded-2xl bg-blue-600 text-white font-semibold shadow hover:shadow-lg hover:bg-blue-700 transition"
        >
          Find Funding
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          className="px-8 py-4 rounded-2xl bg-gray-100 text-gray-900 font-semibold hover:bg-gray-200 transition"
        >
          Generate Plan
        </motion.button>
      </div>
    </section>
  );
}

// --- Value Proposition ---
function ValueProp() {
  return (
    <motion.section
      id="value-prop"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
      className="py-24 bg-white text-center max-w-4xl mx-auto"
    >
      <p className="text-lg text-gray-700 leading-relaxed">
        Built to meet standards of institutions, banks & public funding programs
        nationally & internationally. Works equally for impatient founders and
        expert entrepreneurs.
      </p>
    </motion.section>
  );
}

// --- Use Cases ---
function UseCases() {
  const cases = [
    { icon: <FileText />, title: "Visa Applications", text: "RWR, Freelance Permit" },
    { icon: <Target />, title: "Grants & Public Funding", text: "AWS PreSeed, FFG, EU Startup Calls" },
    { icon: <Briefcase />, title: "Bank Loans / Leasing", text: "Structured for financial standards" },
    { icon: <Users />, title: "Startup / Coaching", text: "Early-stage, Self-employment, Projects" },
  ];
  return (
    <motion.section
      id="use-cases"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
      className="py-20 bg-gray-50"
    >
      <h2 className="text-3xl font-bold text-center mb-12">🧾 Use Cases</h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
        {cases.map((c, i) => (
          <motion.div
            key={i}
            whileHover={{ scale: 1.05 }}
            className="p-6 border rounded-2xl bg-white shadow-sm hover:shadow-md"
          >
            <div className="text-blue-600 mb-4">{c.icon}</div>
            <h3 className="font-semibold text-lg">{c.title}</h3>
            <p className="text-gray-600 text-sm mt-2">{c.text}</p>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}

// --- Product Cards ---
function ProductCards() {
  const products = [
    {
      title: "📘 Custom Business Plan",
      text: "15–35 pages, submission-ready, aligned with institutional & funding standards.",
      ideal: "Visa, grant, loan applications.",
    },
    {
      title: "🔍 Upgrade & Review",
      text: "Revise and upgrade drafts with formatting, rewriting, expert edits.",
      ideal: "Plans needing improvements for AWS, FFG, Banks.",
    },
    {
      title: "🧩 Strategy & Modelling Plan",
      text: "4–8 pages to define early-stage ideas, pivots, or models before scaling.",
      ideal: "Shape your business model with confidence.",
    },
  ];
  return (
    <motion.section
      id="services"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
      className="py-20 bg-white"
    >
      <h2 className="text-3xl font-bold text-center mb-12">Our Services</h2>
      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {products.map((p, i) => (
          <motion.div
            key={i}
            whileHover={{ scale: 1.03 }}
            className="p-6 bg-gray-50 border rounded-2xl shadow-sm hover:shadow-lg"
          >
            <h3 className="text-xl font-semibold mb-2">{p.title}</h3>
            <p className="text-gray-600 mb-2">{p.text}</p>
            <p className="text-gray-800 text-sm">→ Ideal for: {p.ideal}</p>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}

// --- What's Included ---
function WhatsIncluded() {
  const items = [
    "Structured, submission-ready business plan",
    "Delivered as Google Doc or Word (PDF optional)",
    "1-Page Executive Summary included",
    "Optional NDA for confidentiality",
    "1 free revision included",
    "Async process — no calls required",
  ];
  return (
    <motion.section
      id="whats-included"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
      className="py-20 bg-gray-50"
    >
      <h2 className="text-3xl font-bold text-center mb-12">🧾 What’s Included</h2>
      <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-3">
            <CheckCircle className="text-green-500 mt-1" />
            <p className="text-gray-700">{item}</p>
          </div>
        ))}
      </div>
    </motion.section>
  );
}

// --- Pricing Teaser ---
function PricingTeaser() {
  return (
    <motion.section
      id="pricing"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
      className="py-20 bg-white text-center"
    >
      <h2 className="text-3xl font-bold mb-8">💶 Pricing Overview</h2>
      <p className="text-gray-700 mb-6 max-w-3xl mx-auto">
        Each plan is priced based on submission type and complexity. Transparency
        first — no hidden fees.
      </p>
      <div className="flex flex-wrap justify-center gap-8 max-w-5xl mx-auto">
        {[{
          name: "Basic Submission Plan", price: "€500 – €850"
        }, {
          name: "Custom Business Plan", price: "€1.300 – €2.500"
        }, {
          name: "Upgrade / Review", price: "€800 – €1.300"
        }, {
          name: "Strategy & Modelling Plan", price: "€1.000 – €2.000"
        }].map((plan, i) => (
          <div key={i} className="p-6 bg-gray-50 rounded-2xl border shadow-sm w-56">
            <DollarSign className="text-blue-600 mb-2 mx-auto" />
            <p className="font-semibold">{plan.name}</p>
            <p className="text-gray-600">{plan.price}</p>
          </div>
        ))}
      </div>
    </motion.section>
  );
}

// --- Who's Behind It ---
function WhoBehind() {
  return (
    <motion.section
      id="who"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
      className="py-20 bg-gray-50 text-center"
    >
      <h2 className="text-3xl font-bold mb-6">👤 Who’s Behind It?</h2>
      <p className="max-w-3xl mx-auto text-gray-700">
        I’m a startup advisor based in Austria, with a background in business modelling,
        planning and funding. I’ve helped founders and teams secure grants and bank loans —
        including FFG Basisprogramm, Wirtschaftagentur Wien.
      </p>
    </motion.section>
  );
}

// --- Final Call To Action ---
function FinalCTA() {
  return (
    <motion.section
      id="cta"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
      className="py-24 text-center bg-gradient-to-r from-blue-600 to-blue-500 text-white"
    >
      <h2 className="text-4xl font-bold mb-6">💬 Ready to move forward?</h2>
      <button className="px-10 py-4 bg-white text-blue-700 font-semibold rounded-2xl hover:bg-gray-100 transition">
        Get Started Now
      </button>
    </motion.section>
  );
}

// --- Footer ---
function Footer() {
  const links = ["GDPR", "Terms", "Impressum", "Contact", "Pricing", "Examples"];
  return (
    <footer className="py-12 bg-gray-900 text-gray-400 text-sm">
      <div className="max-w-6xl mx-auto flex flex-wrap justify-between">
        <p>© {new Date().getFullYear()} Plan2Fund</p>
        <div className="flex gap-6">
          {links.map((link, i) => (
            <a key={i} href={`#${link.toLowerCase()}`} className="hover:text-white">
              {link}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}

// --- Landing Page Assembler ---
export default function LandingPage() {
  return (
    <main className="font-sans">
      <NavBar />
      <Hero />
      <ValueProp />
      <UseCases />
      <ProductCards />
      <WhatsIncluded />
      <PricingTeaser />
      <WhoBehind />
      <FinalCTA />
      <Footer />
    </main>
  );
}
