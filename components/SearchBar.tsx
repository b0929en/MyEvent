import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';

interface SearchBarProps {
  value?: string;
  onChange?: (value: string) => void;
  onSearch?: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function SearchBar({
  value,
  onChange,
  onSearch,
  placeholder = 'Search...',
  className = ''
}: SearchBarProps) {
  const [internalValue, setInternalValue] = useState(value || '');

  useEffect(() => {
    if (value !== undefined) {
      setInternalValue(value);
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInternalValue(newValue);
    if (onChange) {
      onChange(newValue);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(internalValue);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div className="relative">
        <input
          type="text"
          value={internalValue}
          onChange={handleChange}
          placeholder={placeholder}
          className="w-full px-5 py-3 pr-12 border-1 border-gray-300 rounded-full focus:outline-none focus:border-orange-400 text-gray-700 placeholder:text-gray-400 placeholder:font-light transition-all duration-300"
        />
        <button
          type="submit"
          className="absolute right-5 top-1/2 transform -translate-y-1/2 hover:cursor-pointer hover:text-orange-500 transition-colors"
        >
          <Search className="w-5 h-5 text-gray-500" />
        </button>
      </div>
    </form>
  );
}
