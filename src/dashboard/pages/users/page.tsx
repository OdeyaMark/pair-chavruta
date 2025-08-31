import React, { useEffect, type FC, useState, useMemo } from 'react';
import { Page, WixDesignSystemProvider, Box, Text, ToggleSwitch, Dropdown, FormField } from '@wix/design-system';
import { GenericTable, TableColumn } from "../../../components/GenericTable";
import '@wix/design-system/styles.global.css';
import { fetchCMSData, fetchArchivedUsers } from '../../../data/cmsData';
import { dashboard } from '@wix/dashboard';
import ContactPopup from '../../../components/contactPopup';

interface CMSUser {
  _id: string;
  fullName: string;
  country: string;
  havrutaFound: boolean;
  _createdDate: string;
  // Add other fields as needed
}

// In your table component when clicking contact icon
const DashboardPage: FC = () => {
  const [showArchived, setShowArchived] = useState(false);
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [selectedHasChavruta, setSelectedHasChavruta] = useState<string>('');
  const [cmsData, setCmsData] = useState<CMSUser[]>([]);
  const [contactPopup, setContactPopup] = useState<{
    isOpen: boolean;
    email: string;
    tel: string;
  }>({
    isOpen: false,
    email: '',
    tel: ''
  });

  // In your table component when clicking contact icon
  const handleContactClick = (userId: string) => {
    dashboard.openModal({
      modalId: '45308f7c-1309-42a3-8a0b-00611cab9ebe',
      params: { 
        userId: userId,
        contactMode: true 
      }
    });
  };

  const columns: TableColumn[] = [
    { key: "details", label: "Details", onClick: (id:string) => {
      console.log("Opening modal for user ID:", id);
      dashboard.openModal({modalId:'45308f7c-1309-42a3-8a0b-00611cab9ebe', params: {userId: id}}) }},
    { key: "fullName", label: "Full Name" },
    { key: "country", label: "Country" },
    { key: "contactDetails", label: "Contact Details", onClick: (id: string) => handleContactClick(id) },
    { key: "hasChavruta", label: "Has Chavruta" },
    { key: "registrationDate", label: "Registration Date" }, // Add new column
    { key: "edit", label: "Edit", onClick:(id:string) => {
      console.log("Opening modal for user ID:", id);
      dashboard.openModal({modalId:'45308f7c-1309-42a3-8a0b-00611cab9ebe', params: {userId: id, editMode: true}}) }},
    { key: "notes", label: "Notes", onClick: (id: string) => {
      console.log("Opening modal for user ID:", id);
      dashboard.openModal({modalId:'87855b31-290a-42c2-804a-7b776bdb8f5b', params: {userId: id, initialNote: "", handleSave: ()=> {console.log("saving...")}}}) }},
    { key: "archive", label: "Archive" },
  ];

  const getYearOptions = () => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => ({
      id: `${currentYear - i}`,
      value: `${currentYear - i}`
    }));
  };

  const fetchUsers = async (search: string, page: number, pageSize: number) => {
    let users = cmsData.map((item: CMSUser) => ({
      fullName: item.fullName || "",
      country: item.country || "",
      hasChavruta: item.havrutaFound ? "Yes" : "No",
      details: "View",
      contactDetails: "",
      edit: "edit",
      notes: "",
      archive: "Archive",
      id: item._id || "",
      registrationDate: new Date(item._createdDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }),
      registrationYear: new Date(item._createdDate).getFullYear().toString()
    }));

    // Apply filters using individual states
    if (selectedYear) {
      users = users.filter(user => user.registrationYear === selectedYear);
    }

    if (selectedLocation) {
      users = users.filter(user => user.country.toLowerCase() === selectedLocation.toLowerCase());
    }

    if (selectedHasChavruta) {
      users = users.filter(user => user.hasChavruta === selectedHasChavruta);
    }

    // Apply search
    if (search) {
      users = users.filter(u => u.fullName.toLowerCase().includes(search.toLowerCase()));
    }

    return {
      data: users.slice((page - 1) * pageSize, page * pageSize),
      total: users.length,
    };
  };

  const handleAddUser = () => {
    // TODO: Implement add user logic (modal, form, etc.)
    alert("Add User clicked!");
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.info('Fetching CMS data on Users page...');
        const data = await (showArchived ? fetchArchivedUsers() : fetchCMSData());
        setCmsData(data);
      } catch (error) {
        console.error("Error fetching CMS data:", error);
      }
    };
    fetchData();
  }, [showArchived]); // Re-fetch when archive toggle changes
  const uniqueLocations = useMemo(() => {
    return Array.from(new Set(cmsData?.map(item => item.country)))
      .filter(Boolean)
      .sort()
      .map(location => ({ id: location, value: location }));
  }, [cmsData]);
  
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
                      ...uniqueLocations
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
                  <Box marginLeft="32px">  {/* Increased left margin */}
                    <button 
                      onClick={() => {
                        setSelectedYear('');
                        setSelectedLocation('');
                        setSelectedHasChavruta('');
                      }}
                      style={{
                        width: '150px',
                        padding: '12px 32px',  // Increased padding
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
                        height: '44px',  // Increased height
                        marginTop: '24px'
                      }}
                    >
                      Clear All Filters
                    </button>
                  </Box>
                )}
              </Box>

              {/* Table Section */}
              <GenericTable columns={columns} fetchData={fetchUsers} />
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