import React, { useCallback, useEffect } from "react";
import consola from 'consola';
import Navbar from "../components/Navbar";
import { GenericTable, TableColumn } from "../components/GenericTable";
import { fetchCMSData } from "../data/cmsData";
import type { TableRowBase } from '../types/table.types';

const columns: TableColumn<TableRowBase>[] = [
  { key: "details", label: "Details" },
  { key: "fullName", label: "Full Name" },
  { key: "country", label: "Country" },
  { key: "contactDetails", label: "Contact Details" },
  { key: "hasChavruta", label: "Has Chavruta" },
  { key: "edit", label: "Edit" },
  { key: "notes", label: "Notes" },
  { key: "archive", label: "Archive" },
];

const Users: React.FC = () => {
  consola.info('Users page rendered');
  const handleAddUser = useCallback(() => {
    // TODO: Implement add user logic (modal, form, etc.)
    alert("Add User clicked!");
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
  consola.info('Fetching CMS data on Users page...');
        await fetchCMSData();
      } catch (error) {
  consola.error("Error fetching CMS data:", error);
      }
    };
    fetchData();
  });

  return (
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
        <GenericTable columns={columns} data={[]} total={0} />
      </div>
    </div>
  );
};

export default Users;
