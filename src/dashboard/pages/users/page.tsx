import React, { useEffect, type FC, useState } from 'react';
import { Page, WixDesignSystemProvider } from '@wix/design-system';
import Navbar from "../../../components/Navbar";
import { GenericTable, TableColumn } from "../../../components/GenericTable";
import '@wix/design-system/styles.global.css';
import { fetchCMSData, fetchUserContact } from '../../../data/cmsData';
import { dashboard } from '@wix/dashboard';
import ContactPopup from '../../../components/contactPopup';
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

const DashboardPage: FC = () => {
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
    { key: "notes", label: "Notes" },
    { key: "archive", label: "Archive" },
  ];

  const fetchUsers = async (search: string, page: number, pageSize: number) => {
    // Fetch data from Wix CMS
    const cmsData = await fetchCMSData();
    // Map CMS data to table format
    let users = Array.isArray(cmsData) ? cmsData.map((item: any) => ({
      // Only map fields that sound like the column names
      fullName: item.fullName || "", // matches "Full Name"
      country: item.country || "",   // matches "Country"
      hasChavruta: item.havrutaFound ? "Yes" : "No", // matches "Has Chavruta"
      // Other columns will be left blank or with default values
      details: "View",
      contactDetails: "", // no matching field
      edit: "edit",
      notes: "", // no matching field
      archive: "Archive",
      id: item._id || "", // assuming _id is the unique identifier
      // Add formatted registration date
      registrationDate: new Date(item._createdDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    })) : [];

    // Filter by search
    if (search) {
      users = users.filter(u => u.fullName.toLowerCase().includes(search.toLowerCase()));
    }
    // Pagination
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return {
      data: users.slice(start, end),
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
        await fetchCMSData();
      } catch (error) {
        console.error("Error fetching CMS data:", error);
      }
    };
    fetchData();
  }, []);
  return (
    <WixDesignSystemProvider features={{ newColorsBranding: true }}>
      <Page>
        <Page.Content>
          <div>
            <Navbar />
            <div style={{ maxWidth: 900, margin: "32px auto", padding: "0 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <h2 style={{ margin: 0 }}>Users</h2>
                <button
                  onClick={handleAddUser}
                  style={{ padding: "8px 20px", background: "#1976d2", color: "#fff", border: "none", borderRadius: 4, fontWeight: "bold", cursor: "pointer", fontSize: 16 }}
                >
                  Add User
                </button>
              </div>
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