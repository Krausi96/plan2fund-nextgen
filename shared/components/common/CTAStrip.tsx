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
  const baseClasses = "py-16 md:py-20";
  
  const variantClasses = {
    default: "bg-gray-50",
    dark: "bg-gray-900 text-white",
    gradient: "bg-gradient-to-r from-blue-600 to-blue-700 text-white"
  };
  
  return (
    <section className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      <div className="container text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          {title}
        </h2>
        {subtitle && (
          <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            {subtitle}
          </p>
        )}
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button
            asChild
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
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
              className="px-8 py-3 text-lg"
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
