import { useRef, useEffect } from 'react';
import { SearchIcon, LoaderIcon } from './Icons';

/**
 * Input de búsqueda con icono y loader
 */
const SearchInput = ({ value, onChange, isSearching, autoFocus = true }) => {
  const inputRef = useRef(null);

  // Auto-focus cuando se especifica
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      setTimeout(() => inputRef.current.focus(), 100);
    }
  }, [autoFocus]);

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Escribe para buscar..."
        className="w-full py-4 px-6 text-base border-3 border-outline rounded-lg
                 focus:border-primary focus:outline-none transition-colors"
      />
      {isSearching && (
        <LoaderIcon className="absolute right-3 top-1/2 -translate-y-1/2 size-5 text-secondary animate-spin" />
      )}
    </div>
  );
};

export default SearchInput;
