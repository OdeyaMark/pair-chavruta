import React, { useState, useEffect, useCallback } from "react";
import { Pencil, Trash2, Eye, Settings, Plus, X, Check, Contact2, Archive, StickyNote} from "lucide-react";
import debounce from 'lodash/debounce';
import '../styles/UserTable.css';

export interface TableColumn {
  key: string;
  label: string;
  onClick?: (id: string) => void;
  editable?: {
    options: Array<{ value: string; label: string }>;
    onSelect: (rowId: string, value: string) => void;
  };
}

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  edit: Pencil,
  delete: Trash2,
  details: Eye,
  settings: Settings,
  add: Plus,
  contactDetails: Contact2,
  archive: Archive,
  notes: StickyNote,

  // Add more mappings as needed
};

export interface GenericTableProps {
  columns: TableColumn[];
  fetchData: (search: string, page: number, pageSize: number) => Promise<{
    data: any[];
    total: number;
  }>;
  pageSize?: number;
}

const DEFAULT_PAGE_SIZE = 10;

interface DropdownState {
  isOpen: boolean;
  rowId: string | null;
  columnKey: string | null;
}

export const GenericTable: React.FC<GenericTableProps> = ({ columns, fetchData, pageSize = DEFAULT_PAGE_SIZE }) => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [dropdown, setDropdown] = useState<DropdownState>({
    isOpen: false,
    rowId: null,
    columnKey: null
  });

  const debouncedSearch = useCallback(
    debounce((value: string) => {
      setSearch(value);
      setPage(1);
    }, 300),
    []
  );

  useEffect(() => {
    setLoading(true);
    fetchData(search, page, pageSize)
      .then(res => {
        setData(res.data);
        setTotal(res.total);
      })
      .finally(() => setLoading(false));
  }, [search, page, pageSize, fetchData]);

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
        <div className="dropdown-content">
          {options.map((option) => (
            <div
              key={option.value}
              className="dropdown-item"
              onClick={() => {
                onSelect(rowId, option.value);
                setDropdown({ isOpen: false, rowId: null, columnKey: null });
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

  const renderCellContent = (columnKey: string, value: any, row: any) => {
    const column = columns.find(col => col.key === columnKey);

    if (column?.editable) {
      return (
        <div className="editable-cell">
          <div
            onClick={() => setDropdown({
              isOpen: true,
              rowId: row.id,
              columnKey: columnKey
            })}
            className="editable-value"
          >
            {value}
          </div>
          {renderDropdown(columnKey, row.id, column.editable.options, column.editable.onSelect)}
        </div>
      );
    }

    if (ICON_MAP[columnKey]) {
      const IconComponent = ICON_MAP[columnKey];
      return <IconComponent size={18} className="icon" />;
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

  const totalPages = Math.ceil(total / pageSize);

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
          {loading ? "Loading..." : `${total} results`}
        </span>
      </div>
      <table className="table">
        <thead>
          <tr>
            {columns.map(col => (
              <th key={col.key}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr><td colSpan={columns.length} className="no-data">No data found.</td></tr>
          ) : (
            data.map((row, idx) => (
              <tr key={idx} className="table-row">
                {columns.map(col => (
                  <td
                    key={col.key}
                    onClick={() => (!col.editable && col.onClick) ? col.onClick(row.id) : undefined}
                    className={col.onClick || col.editable ? 'clickable' : ''}
                  >
                    {renderCellContent(col.key, row[col.key], row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
      <div className="pagination">
        <button
          onClick={() => setPage(page - 1)}
          disabled={page === 1 || loading}
          className="pagination-button"
        >
          Prev
        </button>
        <span className="pagination-text">{page} / {totalPages || 1}</span>
        <button
          onClick={() => setPage(page + 1)}
          disabled={page === totalPages || loading}
          className="pagination-button"
        >
          Next
        </button>
      </div>
    </div>
  );
};
