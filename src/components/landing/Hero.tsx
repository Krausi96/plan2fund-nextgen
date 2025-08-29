import { CTAButton } from "@/components/ui/CTAButton";
import TypedText from "@/components/primitives/TypedText";

export default function Hero() {
  return (
    <div className="relative overflow-hidden">
      {/* backdrop orbs */}
      <div className="orb -top-28 -left-20 bg-orb-blue animate-float" />
      <div className="orb top-16 right-0 bg-orb-pink animate-float" />
      <div className="orb -bottom-24 left-1/3 bg-orb-purple animate-float" />

      <div className="container relative z-10 pt-20 pb-16 md:pt-28 md:pb-24">
        <div className="max-w-3xl">
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-gray-900 leading-tight">
            Generate investor-ready business plans in minutes
          </h1>
          <p className="mt-5 text-xl text-gray-700">
            <TypedText
              text="Match funding programs \u2022 Score eligibility \u2022 Auto-assemble structured dossiers"
              speed={12}
              blinkCursor
              className="font-medium"
            />
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <CTAButton variant="primary" size="lg">Start free</CTAButton>
            <CTAButton variant="outline" size="lg">See templates</CTAButton>
          </div>

          <p className="mt-3 text-sm text-gray-500">
            No credit card required. EU/Austria funding datasets included.
          </p>
        </div>
      </div>
    </div>
  );
}
