import { cn } from "@/lib/utils";
import { motion } from "framer-motion";


interface Props {
  id?: string;
  className?: string;
  bg?: "white" | "muted" | "gradient";
  children: React.ReactNode;
}

export default function SectionBlock({ id, className, bg = "white", children }: Props) {
  const bgClass =
    bg === "muted"
      ? "bg-gray-50"
      : bg === "gradient"
      ? "bg-[linear-gradient(135deg,rgba(123,196,255,0.18),rgba(159,124,255,0.18))]"
      : "bg-white";

  return (
    <section id={id} className={cn(bgClass, "relative py-20 md:py-28", className)}>
      <div className="container relative z-10">{children}</div>
      {/* optional faint orbs per section */}
      <div className="orb -left-24 -top-24 bg-orb-blue animate-float" />
      <div className="orb -right-20 bottom-0 bg-orb-purple animate-float" />
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="absolute inset-0"
      />
    </section>
  );
}

