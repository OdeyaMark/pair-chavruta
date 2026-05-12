import React from 'react';

export interface TableColumn {
  key: string;
  label: string;
  onClick?: (rowOrId: any) => void;
  render?: (row: any) => React.ReactNode;
  editable?: {
    options: Array<{ value: string; label: string }>;
    onSelect: (rowId: string, value: string) => void;
  } | ((row: any) => {
    options: Array<{ value: string; label: string }>;
    onSelect: (rowId: string, value: string) => void;
  } | undefined);
}

export interface GenericTableProps {
  columns: TableColumn[];
  data: any[];
  total: number;
  loading?: boolean;
  onSearch?: (searchTerm: string) => void;
  onRowClick?: (row: any) => void;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  pageSize?: number;
  selectedRowId?: string;
}
