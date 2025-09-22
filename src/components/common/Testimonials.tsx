import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Sarah Weber",
    role: "Founder, GreenTech Solutions",
    company: "Vienna",
    content: "Plan2Fund helped us secure €200,000 in EU funding. The program-aware editor made it so easy to create a compliant business plan.",
    rating: 5,
    image: "SW",
  },
  {
    name: "Thomas Müller",
    role: "CEO, Digital Innovations",
    company: "Salzburg",
    content: "The traceable eligibility feature is a game-changer. We knew exactly why we qualified for each program and could optimize our applications.",
    rating: 5,
    image: "TM",
  },
  {
    name: "Anna Kowalski",
    role: "Creative Director, ArtSpace",
    company: "Graz",
    content: "As a creative professional, I never thought I'd find funding for my art projects. Plan2Fund opened doors I didn't know existed.",
    rating: 5,
    image: "AK",
  },
  {
    name: "Dr. Michael Chen",
    role: "Research Director, BioTech Lab",
    company: "Innsbruck",
    content: "The research funding database is incredibly comprehensive. We found 8 different grant programs that matched our research focus.",
    rating: 5,
    image: "MC",
  },
  {
    name: "Lisa Schmidt",
    role: "Founder, EcoStart",
    company: "Linz",
    content: "From idea to funded in 6 weeks. The platform guided us through every step and we secured €75,000 in startup funding.",
    rating: 5,
    image: "LS",
  },
  {
    name: "Robert Bauer",
    role: "Managing Director, SME Solutions",
    company: "Klagenfurt",
    content: "The counterfactual analysis helped us strengthen our business case. We got approved for expansion funding on our first try.",
    rating: 5,
    image: "RB",
  },
];

const logos = [
  "AWS PreSeed",
  "FFG",
  "EU Horizon",
  "Austria Wirtschaftsservice",
  "Vienna Business Agency",
  "Salzburg Business",
];

export function Testimonials() {
  return (
    <section className="section-padding bg-white">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-neutral-900 mb-4">
            Trusted by founders across Austria
          </h2>
          <p className="text-xl text-neutral-600 max-w-2xl mx-auto">
            Join hundreds of successful entrepreneurs who have secured funding with Plan2Fund
          </p>
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="card-hover relative"
            >
              {/* Quote Icon */}
              <Quote className="w-8 h-8 text-primary-100 absolute top-4 right-4" />
              
              {/* Rating */}
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                ))}
              </div>
              
              {/* Content */}
              <p className="text-neutral-700 mb-6 leading-relaxed">
                "{testimonial.content}"
              </p>
              
              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                  {testimonial.image}
                </div>
                <div>
                  <div className="font-semibold text-neutral-900">{testimonial.name}</div>
                  <div className="text-sm text-neutral-600">{testimonial.role}</div>
                  <div className="text-sm text-neutral-500">{testimonial.company}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Partner Logos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <h3 className="text-lg font-semibold text-neutral-600 mb-8">
            Trusted by leading funding organizations
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 items-center opacity-60">
            {logos.map((logo, index) => (
              <div
                key={index}
                className="text-center text-sm font-medium text-neutral-500 py-4 px-2"
              >
                {logo}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
