import { useTranslation } from 'react-i18next';
import { cn, ui } from '../lib/ui.js';

export function SearchBar({
  query,
  onQueryChange,
}: {
  query: string;
  onQueryChange: (q: string) => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-1 items-center">
      <input
        type="search"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder={t('search.placeholder')}
        className={cn(
          ui.input,
          'min-w-[200px] flex-1 rounded-lg px-3 py-2 text-sm transition-[border-color,box-shadow] focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600',
        )}
      />
    </div>
  );
}
