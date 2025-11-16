import Link from "next/link";
import { Button } from "@/shared/components/ui/button";
import { ArrowRight } from "lucide-react";

interface CTAStripProps {
  title: string;
  subtitle?: string;
  primaryAction: {
    label: string;
    href: string;
  };
  secondaryAction?: {
    label: string;
    href: string;
  };
  variant?: 'default' | 'dark' | 'gradient';
  className?: string;
}

export default function CTAStrip({
  title,
  subtitle,
  primaryAction,
  secondaryAction,
  variant = 'default',
  className = ""
}: CTAStripProps) {
  const baseClasses = "py-20 md:py-28";
  
  const variantClasses = {
    default: "bg-gradient-to-b from-white via-blue-50/20 to-white",
    dark: "bg-gradient-to-b from-slate-900 via-blue-900 to-slate-800 text-white",
    gradient: "bg-gradient-to-b from-blue-600 via-blue-700 to-blue-800 text-white"
  };
  
  return (
    <section className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      <div className="container max-w-4xl text-center">
        <h2 className={`text-5xl md:text-6xl font-bold mb-6 tracking-tight ${
          variant === 'dark' || variant === 'gradient' ? 'text-white' : 'text-gray-900'
        }`}>
          {title}
        </h2>
        {subtitle && (
          <p className={`text-xl mb-10 max-w-2xl mx-auto ${
            variant === 'dark' || variant === 'gradient' ? 'text-blue-100' : 'text-gray-600'
          }`}>
            {subtitle}
          </p>
        )}
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button
            asChild
            size="lg"
            className={`px-8 py-4 text-base font-medium rounded-lg transition-all duration-200 ${
              variant === 'dark' || variant === 'gradient'
                ? 'bg-white text-blue-600 hover:bg-blue-50'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            <Link href={primaryAction.href} className="flex items-center gap-2">
              {primaryAction.label}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          
          {secondaryAction && (
            <Button
              asChild
              variant="outline"
              size="lg"
              className={`px-8 py-4 text-base font-medium rounded-lg transition-all duration-200 ${
                variant === 'dark' || variant === 'gradient'
                  ? 'border-white text-white hover:bg-white/10'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Link href={secondaryAction.href}>
                {secondaryAction.label}
              </Link>
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
