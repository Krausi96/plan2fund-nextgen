import Link from "next/link";
import { useRouter } from "next/router";
import { ChevronRight, Home } from "lucide-react";
import { useI18n } from "@/shared/contexts/I18nContext";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface SiteBreadcrumbsProps {
  items?: BreadcrumbItem[];
  className?: string;
}

export default function SiteBreadcrumbs({ items, className = "" }: SiteBreadcrumbsProps) {
  const router = useRouter();
  const { t } = useI18n();
  
  // Auto-generate breadcrumbs from route if not provided
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    if (items) return items;
    
    const pathSegments = router.pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [
      { label: t('breadcrumb.home'), href: '/' }
    ];
    
    let currentPath = '';
    pathSegments.forEach((segment: string, index: number) => {
      currentPath += `/${segment}`;
      
      // Skip dynamic routes like [id]
      if (segment.startsWith('[') && segment.endsWith(']')) {
        return;
      }
      
      // Convert segment to readable label
      const label = segment
        .split('-')
        .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      // Last item is not clickable
      const isLast = index === pathSegments.length - 1;
      breadcrumbs.push({
        label,
        href: isLast ? undefined : currentPath
      });
    });
    
    return breadcrumbs;
  };
  
  const breadcrumbs = generateBreadcrumbs();
  
  // Don't show breadcrumbs on home page
  if (router.pathname === '/') {
    return null;
  }
  
  return (
    <nav 
      aria-label="breadcrumb" 
      className={`bg-gray-50 border-b border-gray-200 py-3 ${className}`}
    >
      <div className="container">
        <ol className="flex items-center space-x-2 text-sm text-gray-600">
          {breadcrumbs.map((item, index) => (
            <li key={index} className="flex items-center">
              {index > 0 && (
                <ChevronRight className="h-4 w-4 text-gray-400 mx-2" />
              )}
              
              {index === 0 ? (
                <Link 
                  href={item.href!} 
                  className="flex items-center text-gray-500 hover:text-blue-600 transition-colors"
                >
                  <Home className="h-4 w-4" />
                  <span className="sr-only">Home</span>
                </Link>
              ) : item.href ? (
                <Link 
                  href={item.href}
                  className="text-gray-600 hover:text-blue-600 transition-colors"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="text-gray-900 font-medium" aria-current="page">
                  {item.label}
                </span>
              )}
            </li>
          ))}
        </ol>
      </div>
    </nav>
  );
}
