import React, { type FC, useState, useEffect, useMemo } from 'react';
import { Page, WixDesignSystemProvider, Dropdown } from '@wix/design-system';
import { Mail, Trash2, Eye } from 'lucide-react';
import '@wix/design-system/styles.global.css';
import { GenericTable, TableColumn } from '../../../components/GenericTable';
import { dashboard } from '@wix/dashboard';
import fetchChavrutasFromCMS from '../../../data/cmsData';


interface ChavrutaRow {
  id: string;
  israeliParticipant: string;
  diasporaParticipant: string;
  creationDate: string;
  track: string;
  status: string;
  matchDate: string;
  details: JSX.Element;
  mail: JSX.Element;
  delete: JSX.Element;
  // Store full participant data
  participantData: {
    israeli: Record<string, any>;
    diaspora: Record<string, any>;
  };
}

const DashboardPage: FC = () => {
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedTrack, setSelectedTrack] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [allChavrutas, setAllChavrutas] = useState<ChavrutaRow[]>([]);
  const [initialFetch, setInitialFetch] = useState(true);

  // Fetch data once when component mounts
  useEffect(() => {
    if (initialFetch) {
      fetchInitialData();
    }
  }, [initialFetch]);

  const fetchInitialData = async () => {
    try {
      const data = await fetchChavrutasFromCMS();
      const formattedData: ChavrutaRow[] = data.map(item => ({
        id: item._id,
        israeliParticipant: item.fromIsraelId?.fullName,
        diasporaParticipant: item.fromWorldId?.fullName,
        creationDate: new Date(item.dateOfCreate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        }),
        track: item.track,
        status: item.status,
        matchDate: item.dateOfCreate,
        details: <div className="icon-cell"><Eye size={20} className="action-icon" /></div>,
        mail: <div className="icon-cell"><Mail size={20} className="action-icon" /></div>,
        delete: <div className="icon-cell"><Trash2 size={20} className="action-icon" /></div>,
        participantData: {
          israeli: item.fromIsraelId,
          diaspora: item.fromWorldId
        }
      }));
      setAllChavrutas(formattedData);
      setInitialFetch(false);
    } catch (error) {
      console.error('Error fetching initial data:', error);
    }
  };

  // Extract unique values for filters
  const filters = useMemo(() => {
    const years = Array.from(new Set(allChavrutas.map(item => 
      new Date(item.matchDate).getFullYear().toString()
    ))).sort();

    const tracks = Array.from(new Set(allChavrutas.map(item => item.track))).sort();
    const statuses = Array.from(new Set(allChavrutas.map(item => item.status))).sort();

    return {
      years: years.map(year => ({ id: year, value: year })),
      tracks: tracks.map(track => ({ id: track, value: track })),
      statuses: statuses.map(status => ({ id: status, value: status }))
    };
  }, [allChavrutas]);

  const handleMailClick = (id: string) => {
    
  };

  const handleDeleteClick = (id: string) => {
    // TODO: Implement deletion logic
    console.log('Delete chavruta match:', id);
  };

  const handleDetailsClick = (id: string) => {
    const chavruta = allChavrutas.find(item => item.id === id);
    if (chavruta) {
      dashboard.openModal({
        modalId: "c83c7139-5b30-4e82-be8f-6870568f6ee0",
        params: { 
          israeliParticipant: chavruta.participantData.israeli,
          diasporaParticipant: chavruta.participantData.diaspora
        }
      });
    }
  };

  const columns: TableColumn[] = [
    { key: "israeliParticipant", label: "Israeli Participant" },
    { key: "diasporaParticipant", label: "Diaspora Participant" },
    { key: "creationDate", label: "Creation Date" },
    { key: "track", label: "Track" },
    { key: "status", label: "Status" },
    { 
      key: "details",
      label: "",
      onClick: (id: string) => handleDetailsClick(id)  // Remove row parameter
    },
    { 
      key: "mail",
      label: "",
      onClick: handleMailClick
    },
    { 
      key: "delete",
      label: "",
      onClick: handleDeleteClick
    }
  ];

  // Update fetchChavrutas to use the stored data
  const fetchChavrutas = async (search: string, page: number, pageSize: number) => {
    let filteredData = [...allChavrutas];

    // Apply filters
    if (selectedYear) {
      filteredData = filteredData.filter(c => 
        new Date(c.matchDate).getFullYear().toString() === selectedYear
      );
    }

    if (selectedTrack) {
      filteredData = filteredData.filter(c => c.track === selectedTrack);
    }

    if (selectedStatus) {
      filteredData = filteredData.filter(c => c.status === selectedStatus);
    }

    // Filter by search
    if (search) {
      filteredData = filteredData.filter(c => 
        c.israeliParticipant.toLowerCase().includes(search.toLowerCase()) ||
        c.diasporaParticipant.toLowerCase().includes(search.toLowerCase()) ||
        c.track.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Pagination
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return {
      data: filteredData.slice(start, end),
      total: filteredData.length,
    };
  };

  return (
    <WixDesignSystemProvider features={{ newColorsBranding: true }}>
      <Page>
        <Page.Header
          title="Chavruta Matches"
          subtitle="View and manage all chavruta pairs"
        />
        <Page.Content>
          <div style={{ maxWidth: 1200, margin: "32px auto", padding: "0 16px" }}>
            <div style={{ 
              display: 'flex', 
              gap: '16px', 
              marginBottom: '24px',
              alignItems: 'flex-end',
              flexWrap: 'wrap'
            }}>
              <div style={{ 
                display: 'flex',
                gap: '16px',
                flexWrap: 'wrap',
                flex: 1,
                minWidth: '0'
              }}>
                <div style={{ width: '200px' }}>
                  <Dropdown
                    placeholder="Filter by Year"
                    options={[
                      { id: '', value: 'All Years' },
                      ...filters.years
                    ]}
                    selectedId={selectedYear}
                    onSelect={(option) => setSelectedYear(option?.id?.toString() || '')}
                  />
                </div>
                <div style={{ width: '200px' }}>
                  <Dropdown
                    placeholder="Filter by Track"
                    options={[
                      { id: '', value: 'All Tracks' },
                      ...filters.tracks
                    ]}
                    selectedId={selectedTrack}
                    onSelect={(option) => setSelectedTrack(option?.id?.toString() || '')}
                  />
                </div>
                <div style={{ width: '200px' }}>
                  <Dropdown
                    placeholder="Filter by Status"
                    options={[
                      { id: '', value: 'All Statuses' },
                      ...filters.statuses
                    ]}
                    selectedId={selectedStatus}
                    onSelect={(option) => setSelectedStatus(option?.id?.toString() || '')}
                  />
                </div>
              </div>
              <button 
                onClick={() => {
                  setSelectedYear('');
                  setSelectedTrack('');
                  setSelectedStatus('');
                }}
                style={{
                  padding: '8px 16px',
                  backgroundColor: selectedYear || selectedTrack || selectedStatus ? '#2b81cb' : '#e6e9ec',
                  color: selectedYear || selectedTrack || selectedStatus ? 'white' : '#162d3d',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  height: '36px'
                }}
                disabled={!selectedYear && !selectedTrack && !selectedStatus}
              >
                Clear All Filters
              </button>
            </div>
            <GenericTable 
              columns={columns} 
              fetchData={fetchChavrutas}
              pageSize={10}
            />
          </div>
        </Page.Content>
      </Page>
    </WixDesignSystemProvider>
  );
};

export default DashboardPage;
