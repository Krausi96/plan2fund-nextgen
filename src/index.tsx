import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import './index.css'; // Assuming you have a CSS file to manage your styles

const LandingPage = () => {

  return (
    <div className="landing-page">

      {/* Hero Section */}
      <section className="hero">
        <motion.div
          className="floating-objects"
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 5, ease: "easeInOut", repeat: Infinity }}
        >
          <div className="floating-object business-plan"></div>
          <div className="floating-object agenda"></div>
          <div className="floating-object targets"></div>
        </motion.div>

        <div className="hero-content">
          <h1>Freedom starts with a clear plan — let’s build yours.</h1>
          <div className="cta-buttons">
            <Link to="/funding" className="cta-btn">Find Funding</Link>
            <Link to="/generate" className="cta-btn">Generate Business Plan</Link>
          </div>
        </div>
      </section>

      {/* Quote Section */}
      <section className="quote">
        <motion.p
          className="quote-text"
          initial={{ width: 0 }}
          animate={{ width: "auto" }}
          transition={{ duration: 5, ease: "ease-in-out" }}
        >
          "Whether you're shaping an idea, applying for funding, or preparing a visa — we turn your thoughts, drafts or existing business into a submission & funding-ready Business Plan."
        </motion.p>
      </section>

      {/* Use Cases Section */}
      <section className="use-cases">
        <h2>Use Cases</h2>
        <div className="card-container">
          <motion.div className="card" whileHover={{ scale: 1.05 }}>
            <h3>Visa Applications</h3>
          </motion.div>
          <motion.div className="card" whileHover={{ scale: 1.05 }}>
            <h3>Grants & Public Funding</h3>
          </motion.div>
          <motion.div className="card" whileHover={{ scale: 1.05 }}>
            <h3>Bank Loans</h3>
          </motion.div>
          <motion.div className="card" whileHover={{ scale: 1.05 }}>
            <h3>Startup, Coaching or Projects</h3>
          </motion.div>
        </div>
      </section>

      {/* Plan Types Section */}
      <section className="plan-types">
        <h2>Plan Types</h2>
        <div className="card-container">
          <motion.div className="plan-card" whileHover={{ scale: 1.05 }}>
            <h3>Custom Business Plan (15–35 pages)</h3>
            <p>Perfect for visa, grant, or loan applications when your business model is clear.</p>
          </motion.div>
          <motion.div className="plan-card" whileHover={{ scale: 1.05 }}>
            <h3>Upgrade & Review</h3>
            <p>We'll revise and upgrade your existing business plan to meet funding standards.</p>
          </motion.div>
          <motion.div className="plan-card" whileHover={{ scale: 1.05 }}>
            <h3>Strategy & Modelling Plan (4–8 pages)</h3>
            <p>For early-stage ideas and consulting clients needing a clearer business model.</p>
          </motion.div>
        </div>
      </section>

      {/* What's Included Section */}
      <section className="whats-included">
        <h2>What's Included</h2>
        <ul>
          <li><motion.span whileHover={{ scale: 1.1 }}>✔ A structured, submission-ready business plan</motion.span></li>
          <li><motion.span whileHover={{ scale: 1.1 }}>✔ Delivered as Google Doc or Word (PDF optional)</motion.span></li>
          <li><motion.span whileHover={{ scale: 1.1 }}>✔ Includes a 1-Page Executive Summary</motion.span></li>
          <li><motion.span whileHover={{ scale: 1.1 }}>✔ Trust Agreement (NDA) option</motion.span></li>
          <li><motion.span whileHover={{ scale: 1.1 }}>✔ One free revision if needed</motion.span></li>
        </ul>
      </section>

      {/* Advantages of Starting a Business in Austria Section */}
      <section className="business-advantages">
        <h2>Advantages of Starting a Business in Austria</h2>
        <div className="advantage">
          <motion.div className="advantage-number" animate={{ opacity: [0, 1], scale: [0.5, 1] }} transition={{ duration: 2 }}>
            500K+
          </motion.div>
          <p>Businesses created in 2023</p>
        </div>
        <div className="advantage">
          <motion.div className="advantage-number" animate={{ opacity: [0, 1], scale: [0.5, 1] }} transition={{ duration: 2 }}>
            1.2B€
          </motion.div>
          <p>Funding distributed to new businesses</p>
        </div>
      </section>

    </div>
  );
};

export default LandingPage;
