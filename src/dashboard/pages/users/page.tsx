import React, { useEffect, type FC, useState, useMemo, useCallback } from 'react';
import { Page, WixDesignSystemProvider, Box, Text, ToggleSwitch, Dropdown, FormField } from '@wix/design-system';
import { GenericTable } from "../../../components/GenericTable";
import '@wix/design-system/styles.global.css';
import { fetchCMSData, fetchArchivedUsers, archiveUser, unarchiveUser, deleteUser } from '../../../data/cmsData';
import { dashboard } from '@wix/dashboard';
import { useTablePagination } from '../../../hooks/useTablePagination';
import { useTableSearch } from '../../../hooks/useTableSearch';
import { useTableFilters } from '../../../hooks/useTableFilters';
import { type User, type UserRow } from '../../../types';
import { formatUsersForTable } from '../../../utils/userFormatters';
import { MODAL_IDS } from '../../../constants/modals';
import { createLogger } from '../../../utils/logger';

const logger = createLogger('users-page');

const DashboardPage: FC = () => {
  // Single source of truth for users data
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Custom hooks for table management
  const { filters, setFilter } = useTableFilters<{
    showArchived: boolean;
    year: string;
    location: string;
    hasChavruta: string;
  }>({
    showArchived: false,
    year: '',
    location: '',
    hasChavruta: ''
  });
  
  const { debouncedSearchTerm, handleSearchChange } = useTableSearch();
  
  const { currentPage, pageSize, setCurrentPage, paginate } = useTablePagination({
    pageSize: 10,
    resetDependencies: [filters.showArchived, filters.year, filters.location, filters.hasChavruta, debouncedSearchTerm]
  });

  // Fetch data once and when showArchived changes
  useEffect(() => {
    fetchInitialData();
  }, [filters.showArchived]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      logger.info('Fetching users data...');
      const data = await (filters.showArchived ? fetchArchivedUsers() : fetchCMSData());
      
      const formattedUsers = formatUsersForTable(data as User[], filters.showArchived);

      setUsers(formattedUsers);
      setLoading(false);
      logger.debug('Users loaded:', formattedUsers.length, 'items');
    } catch (error) {
      logger.error("Error fetching users data:", error);
      setLoading(false);
    }
  };

  // Computed filtered data - updates immediately when users or filters change
  const displayData = useMemo(() => {
    let filtered = [...users];

    // Apply filters
    if (filters.year) {
      filtered = filtered.filter(user => user.registrationYear === filters.year);
    }

    // Location filter: Israel / Not from Israel
    if (filters.location) {
      if (filters.location === 'israel') {
        filtered = filtered.filter(user => (user.country || '').toLowerCase() === 'israel');
      } else if (filters.location === 'not-israel') {
        filtered = filtered.filter(user => (user.country || '').toLowerCase() !== 'israel');
      }
    }

    if (filters.hasChavruta) {
      filtered = filtered.filter(user => user.hasChavruta === filters.hasChavruta);
    }

    // Apply search
    if (debouncedSearchTerm) {
      const search = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter(user => 
        user.fullName.toLowerCase().includes(search) ||
        user.country.toLowerCase().includes(search)
      );
    }
    return {
      data: paginate(filtered),
      total: filtered.length
    };
  }, [users, filters, debouncedSearchTerm, paginate]);

 
  // Event handlers that accept row objects
  const handleDetailsClick = useCallback((row: UserRow) => {
    dashboard.openModal({
      modalId: MODAL_IDS.USER_DETAILS,
      params: { userId: row.id }
    });
  }, []);

  const handleContactClick = useCallback((row: UserRow) => {
    dashboard.openModal({
      modalId: MODAL_IDS.USER_DETAILS,
      params: { 
        userId: row.id,
        contactMode: true 
      }
    });
  }, []);

  const handleEditClick = useCallback((row: UserRow) => {
    logger.debug("Opening edit modal for user ID:", row.id);
    dashboard.openModal({
      modalId: MODAL_IDS.USER_DETAILS,
      params: { 
        userId: row.id, 
        editMode: true 
      }
    });
  }, []);

  const handleNotesClick = useCallback((row: UserRow) => {
    logger.debug("Opening notes modal for user ID:", row.id);
    dashboard.openModal({
      modalId: MODAL_IDS.NOTES,
      params: { 
        userId: row.id, 
        initialNote: "", 
        handleSave: () => { logger.debug("saving..."); }
      }
    });
  }, []);

  const handleArchiveClick = useCallback(async (row: UserRow) => {
    const isUnarchiving = filters.showArchived;
    const action = isUnarchiving ? 'unarchive' : 'archive';
    const confirmed = window.confirm(
      `Are you sure you want to ${action} ${row.fullName}?`
    );
    
    if (!confirmed) return;

    try {
      logger.debug(`${action}ing user:`, row.id);
      if (isUnarchiving) {
        await unarchiveUser(row.id);
      } else {
        await archiveUser(row.id);
      }
      
      // Refresh data after archiving/unarchiving
      await fetchInitialData();
      
      dashboard.showToast({
        message: `User ${action}d successfully.`,
        type: 'success'
      });
    } catch (error) {
      logger.error(`Error ${action}ing user:`, error);
      dashboard.showToast({
        message: `Error ${action}ing user. Please try again.`,
        type: 'error'
      });
    }
  }, [filters.showArchived]);

  const handleDeleteClick = useCallback(async (row: UserRow) => {
    const confirmed = window.confirm(
      `⚠️ WARNING: Are you sure you want to PERMANENTLY DELETE ${row.fullName}?\n\nThis action CANNOT be undone. All user data will be lost forever`
    );
    
    if (!confirmed) return;
    

    try {
      logger.debug("Permanently deleting user:", row.id);
      // TODO: Implement actual delete API call here
      await deleteUser(row.id);
      
      // Refresh data after deletion
      await fetchInitialData();
      
      dashboard.showToast({
        message: 'User permanently deleted.',
        type: 'success'
      });
    } catch (error) {
      logger.error('Error deleting user:', error);
      dashboard.showToast({
        message: 'Error deleting user. Please try again.',
        type: 'error'
      });
    }
  }, []);

  // Define columns with row-based onClick handlers
  const columns = useMemo(() => [
    { 
      key: "details", 
      label: "Details", 
      onClick: (row: UserRow) => handleDetailsClick(row)
    },
    { key: "fullName", label: "Full Name" },
    { key: "country", label: "Country" },
    { 
      key: "contactDetails", 
      label: "Contact Details", 
      onClick: (row: UserRow) => handleContactClick(row)
    },
    { key: "hasChavruta", label: "Has Chavruta" },
    { key: "registrationDate", label: "Registration Date" },
    { 
      key: "edit", 
      label: "Edit", 
      onClick: (row: UserRow) => handleEditClick(row)
    },
    { 
      key: "notes", 
      label: "Notes", 
      onClick: (row: UserRow) => handleNotesClick(row)
    },
    { 
      key: "archive", 
      label: filters.showArchived ? "Unarchive" : "Archive",
      onClick: (row: UserRow) => handleArchiveClick(row)
    },
    { 
      key: "delete", 
      label: "Delete",
      onClick: (row: UserRow) => handleDeleteClick(row)
    },
  ], [handleDetailsClick, handleContactClick, handleEditClick, handleNotesClick, handleArchiveClick, handleDeleteClick, filters.showArchived]);

  const handleAddUser = () => {
    // TODO: Implement add user logic (modal, form, etc.)
    alert("Add User clicked!");
  };

  const getYearOptions = () => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => ({
      id: `${currentYear - i}`,
      value: `${currentYear - i}`
    }));
  };

  const uniqueLocations = useMemo(() => {
    return Array.from(new Set(users?.map(user => user.country)))
      .filter(Boolean)
      .sort()
      .map(location => ({ id: location, value: location }));
  }, [users]);

  const clearAllFilters = useCallback(() => {
    setFilter('year', '');
    setFilter('location', '');
    setFilter('hasChavruta', '');
  }, [setFilter]);
  
  // Add handler for page change
  const handlePageChange = useCallback((page: number) => {
    logger.debug("Page changed to:", page);
    setCurrentPage(page);
  }, [setCurrentPage]);

  return (
    <WixDesignSystemProvider features={{ newColorsBranding: true }}>
      <Page>
        <Page.Content>
          <div>
            <div style={{ maxWidth: 900, margin: "32px auto", padding: "0 16px" }}>
              {/* Header Section */}
              <Box direction="vertical" marginBottom="24px">
                <Box marginBottom="16px">
                  <h2 style={{ margin: 0 }}>Users</h2>
                </Box>
                <Box marginBottom="16px">
                  <button
                    onClick={handleAddUser}
                    style={{ 
                      padding: "8px 20px", 
                      background: "#1976d2", 
                      color: "#fff", 
                      border: "none", 
                      borderRadius: 4, 
                      fontWeight: "bold", 
                      cursor: "pointer", 
                      fontSize: 16 
                    }}
                  >
                    Add User
                  </button>
                </Box>
                <Box direction="horizontal" verticalAlign="middle">
                  <Text size="small" weight="bold" marginRight="12px">
                    Active Users
                  </Text>
                  <Box marginLeft="12px" marginRight="12px">
                    <ToggleSwitch
                      checked={filters.showArchived as boolean}
                      onChange={() => setFilter('showArchived', !(filters.showArchived as boolean))}
                      size="small"
                    />
                  </Box>
                  <Text size="small" weight="bold" marginLeft="12px">
                    Archived Users
                  </Text>
                </Box>
              </Box>

              {/* Filters Section */}
              <Box direction="horizontal" verticalAlign="middle" gap="24px" marginBottom="16px">
                <FormField label="Registration Year">
                  <Dropdown
                    placeholder="Select Year"
                    options={[
                      { id: '', value: 'All Years' },
                      ...getYearOptions()
                    ]}
                    selectedId={filters.year}
                    onSelect={(option) => setFilter('year', option?.id?.toString() || '')}
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
                    selectedId={filters.location}
                    onSelect={(option) => setFilter('location', option?.id?.toString() || '')}
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
                    selectedId={filters.hasChavruta}
                    onSelect={(option) => setFilter('hasChavruta', option?.id?.toString() || '')}
                  />
                </FormField>
                {(filters.year || filters.location || filters.hasChavruta) && (
                  <Box marginLeft="32px">
                    <button 
                      onClick={clearAllFilters}
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

              {/* Table Section - Add onPageChange prop */}
              <GenericTable<UserRow>
                columns={columns} 
                data={displayData.data}
                total={displayData.total}
                loading={loading}
                onSearch={handleSearchChange}
                onRowClick={(row) => handleDetailsClick(row)}
                currentPage={currentPage}
                onPageChange={handlePageChange}
                pageSize={pageSize}
              />
            </div>
          </div>
        </Page.Content>
      </Page>
    </WixDesignSystemProvider>
  );
};

export default DashboardPage;