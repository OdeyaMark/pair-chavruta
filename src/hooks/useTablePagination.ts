import { useState, useEffect } from 'react';

interface UseTablePaginationOptions {
  pageSize?: number;
  resetDependencies?: any[];
}

interface UseTablePaginationReturn {
  currentPage: number;
  pageSize: number;
  setCurrentPage: (page: number) => void;
  resetToFirstPage: () => void;
}

/**
 * Custom hook for managing table pagination state
 * Automatically resets to page 1 when dependencies change (e.g., filters, search)
 * 
 * @param options - Configuration options
 * @param options.pageSize - Number of items per page (default: 10)
 * @param options.resetDependencies - Array of dependencies that trigger reset to page 1
 * 
 * @example
 * const { currentPage, setCurrentPage } = useTablePagination({
 *   pageSize: 10,
 *   resetDependencies: [searchTerm, selectedFilter]
 * });
 */
export const useTablePagination = (
  options: UseTablePaginationOptions = {}
): UseTablePaginationReturn => {
  const { pageSize = 10, resetDependencies = [] } = options;
  const [currentPage, setCurrentPage] = useState(1);

  // Reset to page 1 when dependencies change
  useEffect(() => {
    if (resetDependencies.length > 0) {
      setCurrentPage(1);
    }
  }, resetDependencies);

  const resetToFirstPage = () => {
    setCurrentPage(1);
  };

  return {
    currentPage,
    pageSize,
    setCurrentPage,
    resetToFirstPage
  };
};
