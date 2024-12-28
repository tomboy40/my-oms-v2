import { Search } from "lucide-react";
import { useFlowSearch } from "./hooks/useFlowSearch";
import { useState, useEffect } from 'react';

interface SearchFlowProps {
  initialSearchTerm: string;
  onSearch?: (query: string) => void;
}

export function SearchFlow({ initialSearchTerm, onSearch }: SearchFlowProps) {
  const {
    searchTerm,
    handleSearch,
    clearSearch,
    isExpanded,
    setIsExpanded
  } = useFlowSearch({ initialSearchTerm, onSearch });

  const [inputValue, setInputValue] = useState(searchTerm);

  // Update input value when searchTerm changes (e.g., on initial load)
  useEffect(() => {
    setInputValue(searchTerm);
  }, [searchTerm]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (inputValue.trim()) {
      handleSearch(inputValue.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const form = e.currentTarget.form;
      if (form) {
        form.dispatchEvent(new Event('submit', { cancelable: true }));
      }
    }
    if (e.key === 'Escape') {
      clearSearch();
      setInputValue('');
    }
  };

  return (
    <div className="fixed top-20 left-4 z-50">
      <form id="search-form" onSubmit={handleSubmit} className="relative">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 rounded-lg bg-white shadow-md hover:bg-gray-50 flex items-center justify-center"
        >
          <Search className="h-5 w-5" />
        </button>

        {isExpanded && (
          <div className="absolute left-0 top-0 flex items-center">
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 rounded-l-lg bg-white shadow-md hover:bg-gray-50 flex items-center justify-center border-r border-gray-200"
            >
              <Search className="h-5 w-5" />
            </button>
            <input
              type="text"
              name="search"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Search services..."
              className="h-full w-64 px-4 py-2 rounded-r-lg bg-white shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>
        )}
      </form>
    </div>
  );
}
