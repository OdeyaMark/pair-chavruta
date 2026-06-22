import React, { useState, useEffect } from "react";
import { Pencil, Trash2, Eye, Settings, Plus, X, Check, Contact2, Archive, ArchiveRestore, StickyNote, Handshake} from "lucide-react";
import { IconButton } from './IconButton';
import { ActivateButton, DiscardButton, DeleteButton } from './TableButtons';
import { EditableCell, DropdownState } from './EditableCell';
import type { TableColumn, GenericTableProps, TableRowBase } from '../../types/table.types';
import '../../styles/UserTable.css';

// Re-export for backward compatibility
export { IconButton } from './IconButton';
export type { TableColumn, GenericTableProps } from '../../types/table.types';

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  edit: Pencil,
  deleteIcon: Trash2,
  details: Eye,
  settings: Settings,
  add: Plus,
  contactDetails: Contact2,
  archive: Archive,
  notes: StickyNote,
  pair: Handshake,
  activate: ActivateButton,
  discard: DiscardButton,
  delete: DeleteButton,
};

const DEFAULT_PAGE_SIZE = 10;

export const GenericTable = <TRow extends TableRowBase = TableRowBase>({ 
  columns, 
  data, 
  total,
  loading = false,
  onSearch,
  onRowClick,
  currentPage = 1,
  onPageChange,
  pageSize = DEFAULT_PAGE_SIZE,
  selectedRowId
}: GenericTableProps<TRow>) => {
  const [search, setSearch] = useState("");
  const [dropdown, setDropdown] = useState<DropdownState>({
    isOpen: false,
    rowId: null,
    columnKey: null
  });

  // Handle search change - pass directly to parent without debouncing
  // (parent hooks like useTableSearch handle debouncing)
  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (onSearch) {
      onSearch(value);
    }
  };

  // Handle pagination changes
  const handlePageChange = (newPage: number) => {
    if (onPageChange) {
      onPageChange(newPage);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdown.isOpen && !(event.target as Element).closest('.dropdown-content')) {
        setDropdown({ isOpen: false, rowId: null, columnKey: null });
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdown.isOpen]);

  // Add a safe columns array to avoid undefined in preview builds
  const safeColumns = Array.isArray(columns) ? columns : [];

  const renderCellContent = (columnKey: string, value: unknown, row: TRow) => {
    const column = safeColumns.find((col: TableColumn<TRow>) => col.key === columnKey);

    // Handle function-based or static editable configuration
    let editableConfig;
    if (column?.editable) {
      if (typeof column.editable === 'function') {
        editableConfig = column.editable(row);
      } else {
        editableConfig = column.editable;
      }
    }

    if (editableConfig && editableConfig.options && editableConfig.onSelect) {
      return (
        <EditableCell
          columnKey={columnKey}
          row={row}
          value={value}
          options={editableConfig.options}
          onSelect={editableConfig.onSelect}
          dropdown={dropdown}
          setDropdown={setDropdown}
        />
      );
    }

    if (column?.render) {
      return column.render(row);
    }

    // Special handling for archive column to show different icons
    if (columnKey === "archive") {
      const isUnarchive = typeof value === 'string' && value.includes('Unarchive');
      const IconComponent = isUnarchive ? ArchiveRestore : Archive;
      return (
        <IconButton onClick={(e) => {
          e.stopPropagation();
          if (column?.onClick) {
            column.onClick(row);
            return;
          }
          if (onRowClick) onRowClick(row);
        }}>
          <IconComponent size={18} className="icon" />
        </IconButton>
      );
    }

    if (ICON_MAP[columnKey]) {
      const IconComponent = ICON_MAP[columnKey];
      return (
        <IconButton onClick={(e) => {
          e.stopPropagation();
          // Prefer column-specific handler with full row
          if (column?.onClick) {
            column.onClick(row); // <- pass full row instead of row.id
            return;
          }
          if (onRowClick) onRowClick(row); // <- also pass full row
        }}>
          <IconComponent size={18} className="icon" />
        </IconButton>
      );
    }
    
    if (columnKey === "hasChavruta") {
      if (value === "Yes") {
        return <Check size={18} className="icon icon-success" />;
      } else if (value === "No") {
        return <X size={18} className="icon icon-error" />;
      }
      return value;
    }
    return value;
  };

  // Add safety checks for calculations
  const safeTotal = typeof total === 'number' ? total : 0;
  const safePageSize = typeof pageSize === 'number' && pageSize > 0 ? pageSize : DEFAULT_PAGE_SIZE;
  const totalPages = Math.ceil(safeTotal / safePageSize);
  const safeData = Array.isArray(data) ? data : [];

  return (
    <div className="table-container">
      <div className="table-header">
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={e => handleSearchChange(e.target.value)}
          className="search-input"
        />
        <span className="results-count">
          {loading ? "Loading..." : `${safeTotal} results`}
        </span>
      </div>
      <table className="table">
        <thead>
          <tr>
            {safeColumns.map(col => (
              <th key={col.key}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {safeData.length === 0 ? (
            <tr><td colSpan={safeColumns.length || 1} className="no-data">No data found.</td></tr>
          ) : (
            safeData.map((row, idx) => (
              <tr 
                key={row?.id ?? idx}
                onClick={() => onRowClick && onRowClick(row)}
                className={`table-row ${onRowClick ? 'clickable-row' : ''} ${selectedRowId === row?.id ? 'selected-row' : ''}`}
              >
                {safeColumns.map(col => (
                  <td
                    key={col.key}
                    onClick={(e) => {
                      if (col.onClick && row) {
                        e.stopPropagation();
                        col.onClick(row);
                      }
                    }}
                    className={col.onClick ? 'clickable' : ''}
                  >
                    {renderCellContent(col.key, (row as Record<string, unknown>)?.[col.key], row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
      <div className="pagination">
        <button
          onClick={() => handlePageChange(currentPage - 1)}  // Use currentPage instead of page
          disabled={currentPage === 1 || loading}
          className="pagination-button"
        >
          Prev
        </button>
        <span className="pagination-text">{currentPage} / {totalPages || 1}</span>
        <button
          onClick={() => handlePageChange(currentPage + 1)}  // Use currentPage instead of page
          disabled={currentPage === totalPages || loading || totalPages === 0}
          className="pagination-button"
        >
          Next
        </button>
      </div>
    </div>
  );
};
