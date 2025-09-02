import React, { type FC, useState, useEffect, useMemo, useCallback } from 'react';
import { Page, WixDesignSystemProvider, Dropdown, Box, Text, ToggleSwitch } from '@wix/design-system';
import { Mail, Trash2, Eye, StickyNote } from 'lucide-react';
import '@wix/design-system/styles.global.css';
import { GenericTable, TableColumn } from '../../../components/GenericTable';
import { dashboard } from '@wix/dashboard';
import {fetchChavrutasFromCMS,  updateChavrutaBase } from '../../../data/cmsData';
import { PairStatus, PairStatusLabels } from '../../../constants/status';
import { PreferredTracks, PreferredTracksInfo } from '../../../constants/tracks';


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
  note?: string;
  deleteDate?: string;
  deleteReason?: string;
  notes?: JSX.Element;
}

const DashboardPage: FC = () => {
  // Initialize from sessionStorage with JSX parsing
  const [activeChavrutas, setActiveChavrutas] = useState<ChavrutaRow[]>(() => {
    try {
      const stored = sessionStorage.getItem('activeChavrutas');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  
  const [archivedChavrutas, setArchivedChavrutas] = useState<ChavrutaRow[]>(() => {
    try {
      const stored = sessionStorage.getItem('archivedChavrutas');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [initialFetch, setInitialFetch] = useState(() => {
    const hasActiveData = sessionStorage.getItem('activeChavrutas');
    const hasArchivedData = sessionStorage.getItem('archivedChavrutas');
    return !(hasActiveData || hasArchivedData);
  });

  // Persist data with JSX element recreation
  const persistActiveChavrutas = useCallback((data: ChavrutaRow[]) => {
    // Remove JSX elements before storing
    const dataToStore = data.map(item => ({
      ...item,
      details: null,
      mail: null,
      delete: null,
      notes: null
    }));
    sessionStorage.setItem('activeChavrutas', JSON.stringify(dataToStore));
    
    // Recreate JSX elements for current state
    const dataWithJSX = data.map(item => ({
      ...item,
      details: <div className="icon-cell"><Eye size={20} className="action-icon" /></div>,
      mail: <div className="icon-cell"><Mail size={20} className="action-icon" /></div>,
      delete: <div className="icon-cell"><Trash2 size={20} className="action-icon" /></div>
    }));
    
    setActiveChavrutas(dataWithJSX);
  }, []);

  const persistArchivedChavrutas = useCallback((data: ChavrutaRow[]) => {
    const dataToStore = data.map(item => ({
      ...item,
      details: null,
      notes: null
    }));
    sessionStorage.setItem('archivedChavrutas', JSON.stringify(dataToStore));
    
    const dataWithJSX = data.map(item => ({
      ...item,
      notes: <div className="icon-cell"><StickyNote size={20} className="action-icon" /></div>
    }));
    
    setArchivedChavrutas(dataWithJSX);
  }, []);

  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedTrack, setSelectedTrack] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [showArchived, setShowArchived] = useState(false); // Add this

  // Memoized current data based on toggle
  const allChavrutas = useMemo(() => {
    return showArchived ? archivedChavrutas : activeChavrutas;
  }, [showArchived, activeChavrutas, archivedChavrutas]);

  // Fetch data once when component mounts
  useEffect(() => {
    if (initialFetch) {
      fetchInitialData();
    }
  }, [initialFetch]);

  // Update fetchInitialData to separate active and archived
  const fetchInitialData = async () => {
    try {
      console.log('Fetching initial data...');
      const data = await fetchChavrutasFromCMS();

      const active: ChavrutaRow[] = [];
      const archived: ChavrutaRow[] = [];

      data.forEach(item => {
        const formattedItem: ChavrutaRow = {
          id: item._id,
          israeliParticipant: item.fromIsraelId?.fullName || 'N/A',
          diasporaParticipant: item.fromWorldId?.fullName || 'N/A',
          creationDate: new Date(item.dateOfCreate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          }),
          track: Object.values(PreferredTracksInfo).find(t => t.id === item.track)?.trackEn || 'Unknown Track',
          note: item.note || '',
          status: PairStatusLabels[Number(item.status) as PairStatus] || PairStatusLabels[PairStatus.Default],
          matchDate: item.dateOfCreate,
          participantData: {
            israeli: item.fromIsraelId || {},
            diaspora: item.fromWorldId || {}
          }
        };

        if (item.isDeleted) {
          // Add archived-specific properties
          formattedItem.deleteDate = item.dateOfDelete ? new Date(item.dateOfDelete).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          }) : 'Unknown';
          formattedItem.deleteReason = item.deleteReason || '';
          formattedItem.details = <div className="icon-cell"><Eye size={20} className="action-icon" /></div>;
          formattedItem.notes = <div className="icon-cell"><StickyNote size={20} className="action-icon" /></div>;
          archived.push(formattedItem);
        } else {
          // Add active-specific properties
          formattedItem.details = <div className="icon-cell"><Eye size={20} className="action-icon" /></div>;
          formattedItem.mail = <div className="icon-cell"><Mail size={20} className="action-icon" /></div>;
          formattedItem.delete = <div className="icon-cell"><Trash2 size={20} className="action-icon" /></div>;
          active.push(formattedItem);
        }
      });

      persistActiveChavrutas(active);
      persistArchivedChavrutas(archived);
      setInitialFetch(false);
    } catch (error) {
      console.error('Error fetching initial data:', error);
    }
  };

  // Update useEffect for initial fetch to depend on tracks
  useEffect(() => {
    if (initialFetch) {
      fetchInitialData();
    }
  }, [initialFetch]);

  // Add handler for notes click
  const handleNotesClick = (id: string) => {
    const chavruta = allChavrutas.find(item => item.id === id);
    if (chavruta) {
      dashboard.openModal({
        modalId: "87855b31-290a-42c2-804a-7b776bdb8f5b", // Your notes modal ID
        params: { 
          userId: id,
          initialNote: chavruta.deleteReason || '',
          readOnly: true,
          title: "Delete Reason"
        }
      });
    }
  };

  const handleMailClick = (id: string) => {
    
  };

  // Update handleDeleteClick to open the delete modal
  const handleDeleteClick = (id: string) => {
    dashboard.openModal({
      modalId: "81bfe4af-e5cd-434d-bf31-3641deb7cbd7", // Make sure this matches your delete modal ID
      params: {
        pairId: id,
        onDelete: async (pairId: string, reason: string) => {
          await handleDeletePair(pairId, reason);
        }
      }
    });
  };

  // Replace the existing handleDeletePair with this useCallback version
  const handleDeletePair = useCallback(async (id: string, deleteReason: string) => {
    try {
      
      const chavrutaToDelete = activeChavrutas.find(chavruta => chavruta.id === id);
      if (!chavrutaToDelete) {
        console.error('Chavruta not found in active list');
        console.log('Available active IDs:', activeChavrutas.map(c => c.id));
        return;
      }

      // Update database
      await updateChavrutaBase(id, (chavruta) => ({
        ...chavruta,
        isDeleted: true,
        dateOfDelete: new Date().toISOString(),
        deleteReason: deleteReason
      }));

      // Create archived version
      const archivedChavruta: ChavrutaRow = {
        ...chavrutaToDelete,
        deleteDate: new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        }),
        deleteReason: deleteReason,
        notes: <div className="icon-cell"><StickyNote size={20} className="action-icon" /></div>
      };

      // Update states
      setActiveChavrutas(prev => {
        const filtered = prev.filter(chavruta => chavruta.id !== id);
        return filtered;
      });

      setArchivedChavrutas(prev => {
        const updated = [...prev, archivedChavruta];
        return updated;
      });

    } catch (error) {
      console.error('Error in handleDeletePair:', error);
    }
  }, [activeChavrutas]); // Add activeChavrutas as dependency

  // Update the handleStatusChange function
  const handleStatusChange = async (rowId: string, newStatus: string) => {
    try {
      const statusEntry = Object.entries(PairStatusLabels).find(([_, label]) => label === newStatus);
      if (!statusEntry) return;
      
      const numericStatus = Number(statusEntry[0]);
      
      await updateChavrutaBase(rowId, (chavruta) => ({
        ...chavruta,
        status: numericStatus
      }));
      
      // Update local state - only update activeChavrutas since status is only editable for active items
      setActiveChavrutas(prev => prev.map(chavruta => {
        if (chavruta.id === rowId) {
          return {
            ...chavruta,
            status: newStatus
          };
        }
        return chavruta;
      }));
      
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  // Update handleTrackChange function
  const handleTrackChange = async (rowId: string, newTrack: string) => {
    try {
      // Find track ID using PreferredTracksInfo
      const trackId = Object.values(PreferredTracksInfo).find(t => t.trackEn === newTrack)?.id;
      if (!trackId) {
        console.error('Could not find track ID for track:', newTrack);
        return;
      }
      
      await updateChavrutaBase(rowId, (chavruta) => ({
        ...chavruta,
        track: trackId
      }));
      
      // Update local state - update both active and archived since track can be viewed in both modes
      if (!showArchived) {
        // Only update activeChavrutas when in active mode (since track is only editable there)
        setActiveChavrutas(prev => prev.map(chavruta => {
          if (chavruta.id === rowId) {
            return {
              ...chavruta,
              track: newTrack
            };
          }
          return chavruta;
        }));
      }
      
    } catch (error) {
      console.error('Error updating track:', error);
    }
  };
      

  // Update the handleDetailsClick function
  const handleDetailsClick = (id: string) => {
    const chavruta = allChavrutas.find(item => item.id === id);
    if (chavruta) {
      dashboard.openModal({
        modalId: "c83c7139-5b30-4e82-be8f-6870568f6ee0",
        params: { 
          israeliParticipant: chavruta.participantData.israeli,
          diasporaParticipant: chavruta.participantData.diaspora,
          chavrutaId: id,
          initialNote: chavruta.note // Pass the note
        }
      });
    }
  };

  // Dynamic columns based on archive mode
  const columns: TableColumn[] = useMemo(() => {
    const baseColumns = [
      { key: "israeliParticipant", label: "Israeli Participant" },
      { key: "diasporaParticipant", label: "Diaspora Participant" },
      { key: "creationDate", label: "Creation Date" },
      { 
        key: "track", 
        label: "Track",
        ...(showArchived ? {} : {
          editable: {
            options: Object.values(PreferredTracksInfo)
              .filter(track => track.id)
              .map(track => ({
                value: track.trackEn,
                label: track.trackEn
              })),
            onSelect: handleTrackChange
          }
        })
      }
    ];

    if (showArchived) {
      return [
        ...baseColumns,
        { key: "deleteDate", label: "Delete Date" },
        { 
          key: "notes",
          label: "",
          onClick: (id: string) => handleNotesClick(id)
        }
      ];
    } else {
      return [
        ...baseColumns,
        { 
          key: "status", 
          label: "Status",
          editable: {
            options: Object.values(PairStatus)
              .filter(status => typeof status === 'number')
              .map(status => ({
                value: PairStatusLabels[status as PairStatus],
                label: PairStatusLabels[status as PairStatus]
              })),
            onSelect: handleStatusChange
          }
        },
        { 
          key: "details",
          label: "",
          onClick: (id: string) => handleDetailsClick(id)
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
    }
  }, [showArchived]);

  // Update filters to work with current data
  const filters = useMemo(() => {
    const years = Array.from(new Set(allChavrutas.map(item => 
      new Date(item.matchDate).getFullYear().toString()
    ))).sort();

    const tracks = Array.from(new Set(allChavrutas.map(item => item.track))).sort();
    
    const statuses = Object.values(PairStatus)
      .filter(status => typeof status === 'number')
      .map(status => ({
        id: PairStatusLabels[status as PairStatus],
        value: PairStatusLabels[status as PairStatus]
      }));

    return {
      years: years.map(year => ({ id: year, value: year })),
      tracks: tracks.map(track => ({ id: track, value: track })),
      statuses
    };
  }, [allChavrutas]);

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
        c?.israeliParticipant?.toLowerCase().includes(search.toLowerCase()) ||
        c?.diasporaParticipant?.toLowerCase().includes(search.toLowerCase()) ||
        c?.track?.toLowerCase().includes(search.toLowerCase())
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
            {/* Add Archive Toggle */}
            <Box direction="horizontal" verticalAlign="middle" marginBottom="24px">
              <Text size="small" weight="bold" marginRight="12px">
                Active Chavrutas
              </Text>
              <Box marginLeft="12px" marginRight="12px">
                <ToggleSwitch
                  checked={showArchived}
                  onChange={() => setShowArchived(prev => !prev)}
                  size="small"
                />
              </Box>
              <Text size="small" weight="bold" marginLeft="12px">
                Archived Chavrutas
              </Text>
            </Box>

            {/* Existing filters */}
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
