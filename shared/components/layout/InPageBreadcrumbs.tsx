import { ChevronRight } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
}

interface InPageBreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export default function InPageBreadcrumbs({ items, className = "" }: InPageBreadcrumbsProps) {
  return (
    <nav 
      aria-label="in-page breadcrumb" 
      className={`sticky top-16 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200 py-2 ${className}`}
    >
      <div className="container">
        <ol className="flex items-center space-x-1 text-sm text-gray-600 overflow-x-auto">
          {items.map((item, index) => (
            <li key={index} className="flex items-center flex-shrink-0">
              {index > 0 && (
                <ChevronRight className="h-3 w-3 text-gray-400 mx-1" />
              )}
              
              {item.href ? (
                <a 
                  href={item.href}
                  className="text-gray-600 hover:text-neutral-900 transition-colors px-2 py-1 rounded hover:bg-gray-100"
                >
                  {item.label}
                </a>
              ) : item.onClick ? (
                <button
                  onClick={item.onClick}
                  className="text-gray-600 hover:text-neutral-900 transition-colors px-2 py-1 rounded hover:bg-gray-100"
                >
                  {item.label}
                </button>
              ) : (
                <span className="text-gray-900 font-medium px-2 py-1" aria-current="page">
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
