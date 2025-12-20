import Link from 'next/link';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export default function Breadcrumb({ items, className = '' }: BreadcrumbProps) {
  return (
    <nav className={`text-sm mb-6 ${className}`}>
      {items.map((item, index) => (
        <span key={index}>
          {item.href ? (
            <Link href={item.href} className="text-gray-600 hover:text-orange-500">
              {item.label}
            </Link>
          ) : (
            <span className="text-gray-900">{item.label}</span>
          )}
          {index < items.length - 1 && (
            <span className="mx-2 text-gray-400">&gt;</span>
          )}
        </span>
      ))}
    </nav>
  );
}
