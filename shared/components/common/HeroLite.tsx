interface HeroLiteProps {
  title: string;
  subtitle?: string;
  className?: string;
}

export default function HeroLite({ title, subtitle, className = "" }: HeroLiteProps) {
  return (
    <section className={`py-16 md:py-20 bg-gray-50 ${className}`}>
      <div className="container">
        <div className="animate-fade-in-up text-center max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xl text-gray-600 leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
