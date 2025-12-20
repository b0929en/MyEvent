'use client';

import { Search } from 'lucide-react';

interface SearchBarProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function SearchBar({
  value,
  onChange,
  placeholder = 'Search...',
  className = ''
}: SearchBarProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) {
      onChange(e.target.value);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle search submission if needed
  };

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          className="w-full px-4 py-3 pr-12 border border-gray-500 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 placeholder:text-gray-400"
        />
        <button
          type="submit"
          className="absolute right-3 top-1/2 transform -translate-y-1/2 hover:text-orange-500 transition-colors"
        >
          <Search className="w-5 h-5 text-gray-500" />
        </button>
      </div>
    </form>
  );
}
