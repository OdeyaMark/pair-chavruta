import React from 'react';

interface DropdownState {
  isOpen: boolean;
  rowId: string | null;
  columnKey: string | null;
}

interface EditableCellProps {
  columnKey: string;
  row: any;
  value: any;
  options: Array<{ value: string; label: string }>;
  onSelect: (rowId: string, value: string) => void;
  dropdown: DropdownState;
  setDropdown: React.Dispatch<React.SetStateAction<DropdownState>>;
}

export const EditableCell: React.FC<EditableCellProps> = ({
  columnKey,
  row,
  value,
  options,
  onSelect,
  dropdown,
  setDropdown
}) => {
  const currentValue = value || '';
  const currentLabel = options.find(opt => opt.value === currentValue)?.label || 
                      (options.length > 0 ? options[0].label : 'Select...');

  const isDropdownOpen = dropdown.isOpen && 
                         dropdown.rowId === row.id && 
                         dropdown.columnKey === columnKey;

  return (
    <div className="editable-cell" onClick={(e) => e.stopPropagation()}>
      <div
        onClick={(e) => {
          e.stopPropagation();
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
          {isDropdownOpen ? '▲' : '▼'}
        </span>
      </div>
      {isDropdownOpen && (
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
          {options.map((option) => (
            <div
              key={option.value}
              className="dropdown-item"
              onClick={(e) => {
                e.stopPropagation();
                onSelect(row.id, option.value);
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
      )}
    </div>
  );
};

export type { DropdownState };
