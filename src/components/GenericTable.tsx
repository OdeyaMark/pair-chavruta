import React, { useState, useEffect } from "react";
import { Pencil, Trash2, Eye, Settings, Plus, X, Check, Contact2, Archive, StickyNote} from "lucide-react";

export interface TableColumn {
  key: string;
  label: string;
  onClick?: (id: string) => void; // Optional click handler for actions
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

export const GenericTable: React.FC<GenericTableProps> = ({ columns, fetchData, pageSize = DEFAULT_PAGE_SIZE }) => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log("hello");
    setLoading(true);
    fetchData(search, page, pageSize)
      .then(res => {
        setData(res.data);
        setTotal(res.total);
      })
      .finally(() => setLoading(false));
      console.log('Data fetched:', data);
  }, [search, page, pageSize, fetchData]);

  const totalPages = Math.ceil(total / pageSize);

  const renderCellContent = (columnKey: string, value: any) => {
    // Render icon if columnKey matches ICON_MAP
    if (ICON_MAP[columnKey]) {
      const IconComponent = ICON_MAP[columnKey];
      return (
        <IconComponent 
          size={18} 
          style={{ cursor: 'pointer', color: '#666' }}
        />
      );
    }
    // Special logic for hasChavruta column
    if (columnKey === "hasChavruta") {
      if (value === "Yes") {
        return <Check size={18} style={{ color: 'green', verticalAlign: 'middle' }} />;
      } else if (value === "No") {
        return <X size={18} style={{ color: 'red', verticalAlign: 'middle' }} />;
      }
      return value;
    }
    // Otherwise render value
    return value;
  };

  return (
    <div style={{ maxWidth: 800, margin: "40px auto", background: "#fff", borderRadius: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.08)", padding: 24 }}>
      <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between" }}>
        {/* Search input */}
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          style={{ padding: "8px 12px", borderRadius: 4, border: "1px solid #ccc", width: 200 }}
        />
        <span style={{ fontSize: 14, color: "#888" }}>
          {loading ? "Loading..." : `${total} results`}
        </span>
      </div>
      {/*generic table */}
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            {columns.map(col => (
              <th key={col.key} style={{ textAlign: "left", padding: "10px 8px", borderBottom: "2px solid #eee", background: "#fafafa" }}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr><td colSpan={columns.length} style={{ textAlign: "center", padding: 24 }}>No data found.</td></tr>
          ) : (
            data.map((row, idx) => (
              <tr key={idx} style={{ borderBottom: "1px solid #f0f0f0" }}>
                {columns.map(col => (
                  <td
                    key={col.key}
                    onClick={() => (col.onClick || (() => {}))(row.id)}
                    style={{ padding: "8px", cursor: col.onClick ? 'pointer' : 'default' }}
                  >
                    {renderCellContent(col.key, row[col.key])}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
      {/*pagination controls*/}
      <div style={{ marginTop: 16, display: "flex", justifyContent: "center", alignItems: "center" }}>
        <button
          onClick={() => setPage(page - 1)}
          disabled={page === 1 || loading}
          style={{ marginRight: 8, padding: "6px 12px", borderRadius: 4, border: "1px solid #ccc", background: page === 1 ? "#eee" : "#fff", cursor: page === 1 ? "not-allowed" : "pointer" }}
        >
          Prev
        </button>
        <span style={{ margin: "0 12px" }}>{page} / {totalPages || 1}</span>
        <button
          onClick={() => setPage(page + 1)}
          disabled={page === totalPages || loading}
          style={{ marginLeft: 8, padding: "6px 12px", borderRadius: 4, border: "1px solid #ccc", background: page === totalPages ? "#eee" : "#fff", cursor: page === totalPages ? "not-allowed" : "pointer" }}
        >
          Next
        </button>
      </div>
    </div>
  );
};
