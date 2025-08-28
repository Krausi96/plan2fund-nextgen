import { TypeAnimation } from "react-type-animation";

export function Quote() {
  return (
    <section className="max-w-3xl mx-auto text-center text-xl text-gray-700 italic py-16">
      <TypeAnimation
        sequence={[
          "Whether you're shaping an idea, applying for funding or preparing a visa —",
          1500,
          "we turn your thoughts, drafts or existing business into a submission & funding-ready Business Plan.",
          2000,
        ]}
        wrapper="p"
        speed={50}
        repeat={Infinity}
      />
    </section>
  );
}
