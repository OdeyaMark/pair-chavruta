import React from 'react';

export interface TableRowBase {
  id?: string;
}

export interface TableColumn<TRow extends TableRowBase = TableRowBase> {
  key: string;
  label: string;
  onClick?: (row: TRow) => void;
  render?: (row: TRow) => React.ReactNode;
  editable?: {
    options: Array<{ value: string; label: string }>;
    onSelect: (rowId: string, value: string) => void;
  } | ((row: TRow) => {
    options: Array<{ value: string; label: string }>;
    onSelect: (rowId: string, value: string) => void;
  } | undefined);
}

export interface GenericTableProps<TRow extends TableRowBase = TableRowBase> {
  columns: TableColumn<TRow>[];
  data: TRow[];
  total: number;
  loading?: boolean;
  onSearch?: (searchTerm: string) => void;
  onRowClick?: (row: TRow) => void;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  pageSize?: number;
  selectedRowId?: string;
}
