import { useState, useCallback, useEffect } from 'react';
import debounce from 'lodash/debounce';

interface UseTableSearchOptions {
  debounceMs?: number;
  onSearchChange?: (searchTerm: string) => void;
}

interface UseTableSearchReturn {
  searchTerm: string;
  debouncedSearchTerm: string;
  setSearchTerm: (term: string) => void;
  handleSearchChange: (value: string) => void;
  clearSearch: () => void;
}

/**
 * Custom hook for managing table search with debouncing
 * Provides both immediate and debounced search values
 * 
 * @param options - Configuration options
 * @param options.debounceMs - Debounce delay in milliseconds (default: 300)
 * @param options.onSearchChange - Optional callback when debounced search changes
 * 
 * @example
 * const { searchTerm, debouncedSearchTerm, handleSearchChange } = useTableSearch({
 *   debounceMs: 300,
 *   onSearchChange: (term) => console.log('Search:', term)
 * });
 */
export const useTableSearch = (
  options: UseTableSearchOptions = {}
): UseTableSearchReturn => {
  const { debounceMs = 300, onSearchChange } = options;
  const [searchTerm, setSearchTermState] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Debounced function to update the search term
  const debouncedUpdate = useCallback(
    debounce((value: string) => {
      setDebouncedSearchTerm(value);
      if (onSearchChange) {
        onSearchChange(value);
      }
    }, debounceMs),
    [debounceMs, onSearchChange]
  );

  // Handle search input changes
  const handleSearchChange = useCallback((value: string) => {
    setSearchTermState(value);
    debouncedUpdate(value);
  }, [debouncedUpdate]);

  // Public setter keeps immediate and debounced values in sync.
  const setSearchTerm = useCallback((value: string) => {
    setSearchTermState(value);
    debouncedUpdate(value);
  }, [debouncedUpdate]);

  const clearSearch = useCallback(() => {
    debouncedUpdate.cancel();
    setSearchTermState('');
    setDebouncedSearchTerm('');
    if (onSearchChange) {
      onSearchChange('');
    }
  }, [debouncedUpdate, onSearchChange]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      debouncedUpdate.cancel();
    };
  }, [debouncedUpdate]);

  return {
    searchTerm,
    debouncedSearchTerm,
    setSearchTerm,
    handleSearchChange,
    clearSearch
  };
};
