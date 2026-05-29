import { useState, useCallback, useRef } from 'react';

type FilterValue = string | boolean | number | null;

interface UseTableFiltersReturn<T extends Record<string, FilterValue>> {
  filters: T;
  setFilter: <K extends keyof T>(key: K, value: T[K]) => void;
  resetFilters: () => void;
  resetFilter: <K extends keyof T>(key: K) => void;
}

/**
 * Custom hook for managing multiple table filters
 * Provides a clean API for setting, resetting individual or all filters
 * 
 * @param initialFilters - Initial filter values
 * 
 * @example
 * const { filters, setFilter, resetFilters } = useTableFilters({
 *   year: '',
 *   location: '',
 *   showArchived: false
 * });
 * 
 * // Update a single filter
 * setFilter('year', '2024');
 * 
 * // Reset all filters
 * resetFilters();
 */
export const useTableFilters = <T extends Record<string, FilterValue>>(
  initialFilters: T
): UseTableFiltersReturn<T> => {
  const [filters, setFilters] = useState<T>(initialFilters);
  const initialFiltersRef = useRef<T>(initialFilters);

  const setFilter = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(initialFiltersRef.current);
  }, []);

  const resetFilter = useCallback(<K extends keyof T>(key: K) => {
    setFilters(prev => ({
      ...prev,
      [key]: initialFiltersRef.current[key]
    }));
  }, []);

  return {
    filters,
    setFilter,
    resetFilters,
    resetFilter
  };
};
