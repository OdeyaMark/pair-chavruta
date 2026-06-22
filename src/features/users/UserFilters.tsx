import React, { FC } from 'react';
import { Box, FormField, Dropdown } from '@wix/design-system';

interface UserFiltersProps {
  selectedYear: string;
  selectedLocation: string;
  selectedHasChavruta: string;
  onYearChange: (year: string) => void;
  onLocationChange: (location: string) => void;
  onHavrutaChange: (status: string) => void;
  onClearFilters: () => void;
}

const getYearOptions = () => {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: 5 }, (_, i) => ({
    id: `${currentYear - i}`,
    value: `${currentYear - i}`
  }));
};

export const UserFilters: FC<UserFiltersProps> = ({
  selectedYear,
  selectedLocation,
  selectedHasChavruta,
  onYearChange,
  onLocationChange,
  onHavrutaChange,
  onClearFilters
}) => {
  const hasActiveFilters = selectedYear || selectedLocation || selectedHasChavruta;

  return (
    <Box direction="horizontal" verticalAlign="middle" gap="24px" marginBottom="16px">
      <FormField label="Registration Year">
        <Dropdown
          placeholder="Select Year"
          options={[
            { id: '', value: 'All Years' },
            ...getYearOptions()
          ]}
          selectedId={selectedYear}
          onSelect={(option) => onYearChange(option?.id?.toString() || '')}
        />
      </FormField>
      <FormField label="Location">
        <Dropdown
          placeholder="Select Location"
          options={[
            { id: '', value: 'All Locations' },
            { id: 'israel', value: 'Israel' },
            { id: 'not-israel', value: 'Not from Israel' }
          ]}
          selectedId={selectedLocation}
          onSelect={(option) => onLocationChange(option?.id?.toString() || '')}
        />
      </FormField>
      <FormField label="Has Chavruta">
        <Dropdown
          placeholder="Select Status"
          options={[
            { id: '', value: 'All' },
            { id: 'Yes', value: 'Yes' },
            { id: 'No', value: 'No' }
          ]}
          selectedId={selectedHasChavruta}
          onSelect={(option) => onHavrutaChange(option?.id?.toString() || '')}
        />
      </FormField>
      {hasActiveFilters && (
        <Box marginLeft="32px">
          <button 
            onClick={onClearFilters}
            style={{
              width: '150px',
              padding: '12px 32px',
              backgroundColor: '#2b81cb',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              height: '44px',
              marginTop: '24px'
            }}
          >
            Clear All Filters
          </button>
        </Box>
      )}
    </Box>
  );
};
