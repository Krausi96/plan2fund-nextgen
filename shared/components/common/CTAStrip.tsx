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
    default: "bg-gradient-to-br from-neutral-50 via-blue-50/50 to-white",
    dark: "bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 text-white",
    gradient: "bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white"
  };
  
  const textColorClasses = {
    default: "text-neutral-900",
    dark: "text-white",
    gradient: "text-white"
  };
  
  const subtitleColorClasses = {
    default: "text-neutral-600",
    dark: "text-neutral-300",
    gradient: "text-blue-100"
  };
  
  return (
    <section className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      <div className="container max-w-4xl text-center">
        <h2 className={`text-4xl md:text-5xl font-bold mb-6 tracking-tight ${textColorClasses[variant]}`}>
          {title}
        </h2>
        {subtitle && (
          <p className={`text-xl md:text-2xl mb-10 max-w-2xl mx-auto leading-relaxed ${subtitleColorClasses[variant]}`}>
            {subtitle}
          </p>
        )}
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button
            asChild
            size="lg"
            className={`px-10 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 ${
              variant === 'gradient' || variant === 'dark'
                ? 'bg-white text-blue-600 hover:bg-blue-50'
                : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white'
            }`}
          >
            <Link href={primaryAction.href} className="flex items-center gap-2">
              {primaryAction.label}
              <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
          
          {secondaryAction && (
            <Button
              asChild
              variant="outline"
              size="lg"
              className={`px-10 py-4 text-lg font-semibold rounded-xl border-2 transition-all duration-300 ${
                variant === 'gradient' || variant === 'dark'
                  ? 'border-white text-white hover:bg-white/10'
                  : 'border-blue-600 text-blue-600 hover:bg-blue-50'
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
