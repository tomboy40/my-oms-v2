import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "@remix-run/react";
import { Search } from "lucide-react";

interface SearchFlowProps {
  initialQuery: string;
  onSearch?: (query: string) => void;
}

export function SearchFlow({ initialQuery, onSearch }: SearchFlowProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(initialQuery);
  const [isExpanded, setIsExpanded] = useState(!!initialQuery);

  useEffect(() => {
    setQuery(initialQuery);
    setIsExpanded(!!initialQuery);
  }, [initialQuery]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const search = formData.get("search") as string;
    
    if (search) {
      onSearch?.(search);
      const newParams = new URLSearchParams(searchParams);
      newParams.set("search", search);
      setSearchParams(newParams);
    }
    // Don't collapse the search after submission
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const form = e.currentTarget.form;
      if (form) {
        form.dispatchEvent(new Event('submit', { cancelable: true }));
      }
    }
    if (e.key === 'Escape') {
      setIsExpanded(false);
      setQuery('');
    }
  };

  return (
    <div className="absolute top-4 left-4 z-50">
      <form id="search-form" onSubmit={handleSubmit}>
        <div 
          className={`
            flex items-center bg-white rounded-lg shadow-lg transition-all duration-200 ease-in-out
            ${isExpanded ? 'w-64' : 'w-10 hover:w-12'}
          `}
        >
          <button
            type="button"
            onClick={() => {
              setIsExpanded(!isExpanded);
              if (!isExpanded) {
                // Focus the input after expanding
                setTimeout(() => {
                  const input = document.querySelector('input[name="search"]') as HTMLInputElement;
                  if (input) {
                    input.focus();
                  }
                }, 100);
              }
            }}
            className={`
              p-2 text-gray-500 hover:text-gray-700 transition-all duration-200
              ${isExpanded ? 'bg-gray-100 rounded-l-lg' : 'rounded-lg hover:bg-gray-100 w-full'}
            `}
          >
            <Search size={20} className="min-w-[20px]" />
          </button>
          
          {isExpanded && (
            <input
              type="text"
              name="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Search by app ID..."
              className="flex-1 px-3 py-2 border-none focus:outline-none focus:ring-0 text-sm"
              autoFocus
            />
          )}
        </div>
      </form>
    </div>
  );
}
