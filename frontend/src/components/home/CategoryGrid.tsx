import type { Category } from '../types';
import { Link } from 'react-router-dom';
import { CATEGORIES } from '../../lib/constants';

interface CategoryGridProps {
  categories?: Category[];
}

export function CategoryGrid({ categories }: CategoryGridProps) {
  const cats = categories || CATEGORIES;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {cats.map((cat) => (
        <Link
          key={cat.slug}
          to={`/categories/${cat.slug}`}
          className="group flex items-center gap-3 p-4 rounded-xl bg-surface border border-border/50 hover:border-primary/30 hover:bg-surface-light transition-all duration-200"
        >
          <span className="text-xl">{cat.icon}</span>
          <span className="text-sm font-medium text-muted-foreground group-hover:text-white transition-colors truncate">
            {cat.name}
          </span>
        </Link>
      ))}
    </div>
  );
}
