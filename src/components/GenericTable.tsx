import React, { useState, useEffect, useCallback } from "react";
import { Pencil, Trash2, Eye, Settings, Plus, X, Check, Contact2, Archive, StickyNote, Handshake} from "lucide-react";
import debounce from 'lodash/debounce';
import '../styles/UserTable.css';

export interface TableColumn {
  key: string;
  label: string;
  onClick?: (id: string) => void;
  render?: (row: any) => React.ReactNode;
  editable?: {
    options: Array<{ value: string; label: string }>;
    onSelect: (rowId: string, value: string) => void;
  } | ((row: any) => {
    options: Array<{ value: string; label: string }>;
    onSelect: (rowId: string, value: string) => void;
  } | undefined);
}

// Add this custom button component
const ActivateButton: React.FC = () => (
  <div className="button-with-title">
    <Check size={18} className="icon-success" />
    <span className="button-title">Activate</span>
  </div>
);

const DiscardButton: React.FC = () => (
  <div className="button-with-title discard">
    <X size={18} className="icon-danger" />
    <span className="button-title">Discard</span>
  </div>
);

// Insert IconButton here
export const IconButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ children, onClick, ...props }) => {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        if (onClick) onClick(e);
      }}
      {...props}
      className={`icon-button ${props.className || ''}`}
    >
      {children}
    </button>
  );
};

// ICON_MAP follows...
const ICON_MAP: Record<string, React.ComponentType<any>> = {
  edit: Pencil,
  delete: Trash2,
  details: Eye,
  settings: Settings,
  add: Plus,
  contactDetails: Contact2,
  archive: Archive,
  notes: StickyNote,
  pair: Handshake,
  activate: ActivateButton,  // Add this line
  discard: DiscardButton,  // Add this line
  // Add more mappings as needed
};

export interface GenericTableProps {
  columns: TableColumn[];
  data: any[];
  total?: number;
  loading?: boolean;
  onSearch?: (search: string, page: number, pageSize: number) => void;
  pageSize?: number;
  // changed: pass the full row (not only id)
  onRowClick?: (row: any) => void;
  selectedRowId?: string;
}

const DEFAULT_PAGE_SIZE = 10;

interface DropdownState {
  isOpen: boolean;
  rowId: string | null;
  columnKey: string | null;
}

export const GenericTable: React.FC<GenericTableProps> = ({ 
  columns = [], // Add default empty array
  data = [], // Add default empty array
  total = 0,
  loading = false,
  onSearch,
  pageSize = DEFAULT_PAGE_SIZE,
  onRowClick,
  selectedRowId
}) => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [dropdown, setDropdown] = useState<DropdownState>({
    isOpen: false,
    rowId: null,
    columnKey: null
  });

  const debouncedSearch = useCallback(
    debounce((value: string) => {
      setSearch(value);
      setPage(1);
      if (onSearch) {
        onSearch(value, 1, pageSize);
      }
    }, 300),
    [onSearch, pageSize]
  );

  // Handle pagination changes
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    if (onSearch) {
      onSearch(search, newPage, pageSize);
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

  const renderDropdown = (columnKey: string, rowId: string, options: Array<{ value: string; label: string }>, onSelect: (rowId: string, value: string) => void) => {
    if (dropdown.isOpen && dropdown.rowId === rowId && dropdown.columnKey === columnKey) {
      return (
        <div className="dropdown-content" style={{
          position: 'absolute',
          top: '100%',
          left: '0',
          right: '0',
          backgroundColor: 'white',
          border: '1px solid #ddd',
          borderRadius: '4px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          zIndex: 1000,
          maxHeight: '200px',
          overflowY: 'auto'
        }}>
          {(options || []).map((option) => (
            <div
              key={option.value}
              className="dropdown-item"
              onClick={(e) => {
                e.stopPropagation();
                onSelect(rowId, option.value);
                setDropdown({ isOpen: false, rowId: null, columnKey: null });
              }}
              style={{
                padding: '8px 12px',
                cursor: 'pointer',
                borderBottom: '1px solid #eee'
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLElement).style.backgroundColor = '#f5f5f5';
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.backgroundColor = 'white';
              }}
            >
              {option.label}
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  // Add a safe columns array to avoid undefined in preview builds
  const safeColumns = Array.isArray(columns) ? columns : [];

  const renderCellContent = (columnKey: string, value: any, row: any) => {
    const column = safeColumns.find(col => col.key === columnKey);

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
      const options = editableConfig.options || []; // Add safety check
      
      // Get current selected value or default to first option
      const currentValue = value || '';
      const currentLabel = options.find(opt => opt.value === currentValue)?.label || 
                          (options.length > 0 ? options[0].label : 'Select...');

      return (
        <div className="editable-cell">
          <div
            onClick={() => {
              if (options.length > 0) {
                setDropdown({
                  isOpen: !dropdown.isOpen || dropdown.rowId !== row.id || dropdown.columnKey !== columnKey,
                  rowId: row.id,
                  columnKey: columnKey
                });
              }
            }}
            className="editable-value"
            style={{
              cursor: 'pointer',
              padding: '4px 8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              backgroundColor: 'white',
              minHeight: '20px',
              position: 'relative',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <span>{currentLabel}</span>
            <span style={{ marginLeft: '8px' }}>
              {dropdown.isOpen && dropdown.rowId === row.id && dropdown.columnKey === columnKey ? '▲' : '▼'}
            </span>
          </div>
          {renderDropdown(columnKey, row.id, options, editableConfig.onSelect)}
        </div>
      );
    }

    if (column?.render) {
      return column.render(row);
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
          onChange={e => debouncedSearch(e.target.value)}
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
                onClick={() => onRowClick && onRowClick(row)} // <- pass row
                className={`table-row ${onRowClick ? 'clickable-row' : ''} ${selectedRowId === row?.id ? 'selected-row' : ''}`}
              >
                {safeColumns.map(col => (
                  <td
                    key={col.key}
                    onClick={(e) => {
                      if (col.onClick && row?.id) {
                        e.stopPropagation();
                        col.onClick(row.id);
                      }
                    }}
                    className={col.onClick ? 'clickable' : ''}
                  >
                    {renderCellContent(col.key, row?.[col.key], row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
      <div className="pagination">
        <button
          onClick={() => handlePageChange(page - 1)}
          disabled={page === 1 || loading}
          className="pagination-button"
        >
          Prev
        </button>
        <span className="pagination-text">{page} / {totalPages || 1}</span>
        <button
          onClick={() => handlePageChange(page + 1)}
          disabled={page === totalPages || loading || totalPages === 0}
          className="pagination-button"
        >
          Next
        </button>
      </div>
    </div>
  );
};
