import React, { useEffect, type FC, useState, useMemo, useCallback } from 'react';
import { Page, WixDesignSystemProvider, Box, Text, ToggleSwitch, Dropdown, FormField } from '@wix/design-system';
import { GenericTable, TableColumn } from "../../../components/GenericTable";
import '@wix/design-system/styles.global.css';
import { fetchCMSData, fetchArchivedUsers, archiveUser, unarchiveUser, deleteUser } from '../../../data/cmsData';
import { dashboard } from '@wix/dashboard';
import ContactPopup from '../../../components/contactPopup';

interface CMSUser {
  _id: string;
  fullName: string;
  country: string;
  matchTo: number;
  prefNumberOfMatches: number;
  dateOfRegistered: string;
  _createdDate: string;
  // Add other fields as needed
}

interface UserRow {
  id: string;
  fullName: string;
  country: string;
  hasChavruta: string;
  details: string;
  contactDetails: string;
  edit: string;
  notes: string;
  archive: string;
  delete: string;  // Add this line
  registrationDate: string;
  registrationYear: string;
}

const DashboardPage: FC = () => {
  // Single source of truth for users data
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // UI state
  const [showArchived, setShowArchived] = useState(false);
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [selectedHasChavruta, setSelectedHasChavruta] = useState<string>('');
  const [contactPopup, setContactPopup] = useState<{
    isOpen: boolean;
    email: string;
    tel: string;
  }>({
    isOpen: false,
    email: '',
    tel: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Fetch data once and when showArchived changes
  useEffect(() => {
    fetchInitialData();
  }, [showArchived]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      console.info('Fetching users data...');
      const data = await (showArchived ? fetchArchivedUsers() : fetchCMSData());
      
      const formattedUsers = (data as CMSUser[]).map((item) => ({
        id: item._id || "",
        fullName: item.fullName || "",
        country: item.country || "",
        hasChavruta: item.matchTo < item.prefNumberOfMatches ? "No" : "Yes",
        details: "View",
        contactDetails: "",
        edit: "edit",
        notes: "",
        archive: showArchived ? "↑ Unarchive" : "↓ Archive",
        delete: "Delete",  // Add this line
        registrationDate: new Date(item.dateOfRegistered).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        }),
        registrationYear: new Date(item.dateOfRegistered).getFullYear().toString()
      }));

      setUsers(formattedUsers);
      setLoading(false);
      console.log('Users loaded:', formattedUsers.length, 'items');
    } catch (error) {
      console.error("Error fetching users data:", error);
      setLoading(false);
    }
  };

  // Computed filtered data - updates immediately when users or filters change
  const displayData = useMemo(() => {
    let filtered = [...users];

    // Apply filters
    if (selectedYear) {
      filtered = filtered.filter(user => user.registrationYear === selectedYear);
    }

    // Location filter: Israel / Not from Israel
    if (selectedLocation) {
      if (selectedLocation === 'israel') {
        filtered = filtered.filter(user => (user.country || '').toLowerCase() === 'israel');
      } else if (selectedLocation === 'not-israel') {
        filtered = filtered.filter(user => (user.country || '').toLowerCase() !== 'israel');
      }
    }

    if (selectedHasChavruta) {
      filtered = filtered.filter(user => user.hasChavruta === selectedHasChavruta);
    }

    // Apply search
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(user => 
        user.fullName.toLowerCase().includes(search) ||
        user.country.toLowerCase().includes(search)
      );
    }
    // Pagination
     const startIdx = (currentPage - 1) * pageSize;
     console.log("Current Page:", currentPage, "Start Index:", startIdx);
    const paginatedData = filtered.slice(startIdx, startIdx + pageSize);
    console.log("Filtered and paginated data:", paginatedData);
    return {
      data: paginatedData,
      total: filtered.length
    };
  }, [users, selectedYear, selectedLocation, selectedHasChavruta, searchTerm, currentPage]);

 
  // Event handlers that accept row objects
  const handleDetailsClick = useCallback((row: UserRow) => {
    dashboard.openModal({
      modalId: '45308f7c-1309-42a3-8a0b-00611cab9ebe', 
      params: { userId: row.id }
    });
  }, []);

  const handleContactClick = useCallback((row: UserRow) => {
    dashboard.openModal({
      modalId: '45308f7c-1309-42a3-8a0b-00611cab9ebe',
      params: { 
        userId: row.id,
        contactMode: true 
      }
    });
  }, []);

  const handleEditClick = useCallback((row: UserRow) => {
    console.log("Opening edit modal for user ID:", row.id);
    dashboard.openModal({
      modalId: '45308f7c-1309-42a3-8a0b-00611cab9ebe', 
      params: { 
        userId: row.id, 
        editMode: true 
      }
    });
  }, []);

  const handleNotesClick = useCallback((row: UserRow) => {
    console.log("Opening notes modal for user ID:", row.id);
    dashboard.openModal({
      modalId: '87855b31-290a-42c2-804a-7b776bdb8f5b', 
      params: { 
        userId: row.id, 
        initialNote: "", 
        handleSave: () => { console.log("saving..."); }
      }
    });
  }, []);

  const handleArchiveClick = useCallback(async (row: UserRow) => {
    const isUnarchiving = showArchived;
    const action = isUnarchiving ? 'unarchive' : 'archive';
    const confirmed = window.confirm(
      `Are you sure you want to ${action} ${row.fullName}?`
    );
    
    if (!confirmed) return;

    try {
      console.log(`${action}ing user:`, row.id);
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
      console.error(`Error ${action}ing user:`, error);
      dashboard.showToast({
        message: `Error ${action}ing user. Please try again.`,
        type: 'error'
      });
    }
  }, [showArchived]);

  const handleDeleteClick = useCallback(async (row: UserRow) => {
    const confirmed = window.confirm(
      `⚠️ WARNING: Are you sure you want to PERMANENTLY DELETE ${row.fullName}?\n\nThis action CANNOT be undone. All user data will be lost forever`
    );
    
    if (!confirmed) return;
    

    try {
      console.log("Permanently deleting user:", row.id);
      // TODO: Implement actual delete API call here
      await deleteUser(row.id);
      
      // Refresh data after deletion
      await fetchInitialData();
      
      dashboard.showToast({
        message: 'User permanently deleted.',
        type: 'success'
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      dashboard.showToast({
        message: 'Error deleting user. Please try again.',
        type: 'error'
      });
    }
  }, []);

  // Define columns with row-based onClick handlers
  const columns: TableColumn[] = useMemo(() => [
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
      label: showArchived ? "Unarchive" : "Archive",
      onClick: (row: UserRow) => handleArchiveClick(row)
    },
    { 
      key: "delete", 
      label: "Delete",
      onClick: (row: UserRow) => handleDeleteClick(row)
    },
  ], [handleDetailsClick, handleContactClick, handleEditClick, handleNotesClick, handleArchiveClick, handleDeleteClick, showArchived]);

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
    setSelectedYear('');
    setSelectedLocation('');
    setSelectedHasChavruta('');
  }, []);
  
  // Add handler for page change
  const handlePageChange = useCallback((page: number) => {
    console.log("Page changed to:", page);
    setCurrentPage(page);
  }, []);

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
                      checked={showArchived}
                      onChange={() => setShowArchived(prev => !prev)}
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
                    selectedId={selectedYear}
                    onSelect={(option) => setSelectedYear(option?.id?.toString() || '')}
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
                    onSelect={(option) => setSelectedLocation(option?.id?.toString() || '')}
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
                    onSelect={(option) => setSelectedHasChavruta(option?.id?.toString() || '')}
                  />
                </FormField>
                {(selectedYear || selectedLocation || selectedHasChavruta) && (
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
              <GenericTable 
                columns={columns} 
                data={displayData.data}
                total={displayData.total}
                loading={loading}
                onSearch={(search) => setSearchTerm(search)}
                onRowClick={(row) => handleDetailsClick(row)}
                currentPage={currentPage}  // Pass current page
                onPageChange={handlePageChange}  // Pass page change handler
                pageSize={pageSize}  // Pass page size
              />
              
              {contactPopup.isOpen && (
                <ContactPopup
                  email={contactPopup.email}
                  tel={contactPopup.tel}
                  onClose={() => setContactPopup(prev => ({ ...prev, isOpen: false }))}
                />
              )}
            </div>
          </div>
        </Page.Content>
      </Page>
    </WixDesignSystemProvider>
  );
};

export default DashboardPage;