import React, { type FC, useState, useEffect, useMemo, useCallback } from 'react';
import { Page, WixDesignSystemProvider, Dropdown, Box, Text, ToggleSwitch } from '@wix/design-system';
import { Mail, Trash2, Eye, StickyNote } from 'lucide-react';
import '@wix/design-system/styles.global.css';
import { GenericTable, TableColumn } from '../../../components/GenericTable';
import { dashboard } from '@wix/dashboard';
import { 
  fetchChavrutasFromCMS, 
  deleteChavrutaAndUpdateUsers,
  updateChavrutaBase
} from '../../../data/cmsData';
import { PairStatus, PairStatusLabels } from '../../../constants/status';
import { PreferredTracks, PreferredTracksInfo } from '../../../constants/tracks';
import { MODAL_IDS } from '../../../constants/modals';
import { useTablePagination } from '../../../hooks/useTablePagination';
import { createLogger } from '../../../utils/logger';

const logger = createLogger('chavrutas-page');


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
  // State for data and UI
  const [activeChavrutas, setActiveChavrutas] = useState<ChavrutaRow[]>([]);
  const [archivedChavrutas, setArchivedChavrutas] = useState<ChavrutaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedTrack, setSelectedTrack] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [showArchived, setShowArchived] = useState(false);
  
  // Search and pagination state
  const [search, setSearch] = useState('');

  const { currentPage, pageSize, setCurrentPage, paginate } = useTablePagination({
    pageSize: 10,
    resetDependencies: [selectedYear, selectedTrack, selectedStatus, showArchived, search]
  });

  // Simple data fetching on component mount
  useEffect(() => {
    fetchInitialData();
  }, []);

  // Update fetchInitialData to use the stored data
  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const data = await fetchChavrutasFromCMS();
      const active: ChavrutaRow[] = [];
      const archived: ChavrutaRow[] = [];
      
      data.forEach(item => {
        const formattedItem: ChavrutaRow = {
          id: item._id,
          israeliParticipant: item.newFromIsraelId?.fullName || 'N/A',
          diasporaParticipant: item.newFromWorldId?.fullName || 'N/A',
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
            israeli: item.newFromIsraelId || {},
            diaspora: item.newFromWorldId || {}
          },
          // Create JSX elements directly here - no serialization issues
          details: <div className="icon-cell"><Eye size={20} className="action-icon" /></div>,
          mail: <div className="icon-cell"><Mail size={20} className="action-icon" /></div>,
          delete: <div className="icon-cell"><Trash2 size={20} className="action-icon" /></div>,
          notes: <div className="icon-cell"><StickyNote size={20} className="action-icon" /></div>
        };

        if (item.isDeleted) {
          formattedItem.deleteDate = item.dateOfDelete ? new Date(item.dateOfDelete).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          }) : 'Unknown';
          formattedItem.deleteReason = item.deleteReason || '';
          archived.push(formattedItem);
        } else {
          active.push(formattedItem);
        }
      });

      logger.debug('Setting active chavrutas:', active.length);
      logger.debug('Setting archived chavrutas:', archived.length);
      
      setActiveChavrutas(active);
      setArchivedChavrutas(archived);
      setLoading(false);
    } catch (error) {
      logger.error('Error fetching initial data:', error);
      setLoading(false);
    }
  };

  // Simplified handlers - optimistic updates for immediate UI feedback
  const handleDeletePair = useCallback(async (id: string, deleteReason: string) => {
    const prevActiveChavrutas = activeChavrutas;
    const prevArchivedChavrutas = archivedChavrutas;

    try {
      const chavrutaToDelete = activeChavrutas.find(chavruta => chavruta.id === id);
      if (!chavrutaToDelete) {
        logger.error('Chavruta not found in active list');
        return;
      }

      // Create archived version
      const archivedChavruta: ChavrutaRow = {
        ...chavrutaToDelete,
        deleteDate: new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        }),
        deleteReason: deleteReason,
      };

      // Optimistic update - immediate UI feedback
      setActiveChavrutas(prev => prev.filter(chavruta => chavruta.id !== id));
      setArchivedChavrutas(prev => [...prev, archivedChavruta]);

      // Update database
      await deleteChavrutaAndUpdateUsers(id);

    } catch (error) {
      logger.error('Error in handleDeletePair:', error);
      // Revert optimistic updates on failure
      setActiveChavrutas(prevActiveChavrutas);
      setArchivedChavrutas(prevArchivedChavrutas);
      dashboard.showToast({
        message: 'Failed to delete pair. Please try again.',
        type: 'error'
      });
    }
  }, [activeChavrutas, archivedChavrutas]);

  // const [selectedYear, setSelectedYear] = useState<string>('');
  // const [selectedTrack, setSelectedTrack] = useState<string>('');
  // const [selectedStatus, setSelectedStatus] = useState<string>('');
  // const [showArchived, setShowArchived] = useState(false); // Add this

  // Current data based on toggle
  const currentChavrutas = useMemo(() => {
    return showArchived ? archivedChavrutas : activeChavrutas;
  }, [showArchived, activeChavrutas, archivedChavrutas]);

  // Add handler for page change
  const handlePageChange = useCallback((page: number) => {
    logger.debug("Page changed to:", page);
    setCurrentPage(page);
  }, []);

  // Add handler for search
  const handleSearchChange = useCallback((searchTerm: string) => {
    setSearch(searchTerm);
  }, []);

  // Filtered and paginated data for immediate display
  const filteredAndPaginatedData = useMemo(() => {
    let filteredData = [...currentChavrutas];

    // Apply filters
    if (selectedYear) {
      filteredData = filteredData.filter(item => 
        new Date(item.matchDate).getFullYear().toString() === selectedYear
      );
    }

    if (selectedTrack) {
      filteredData = filteredData.filter(item => item.track === selectedTrack);
    }

    if (selectedStatus) {
      filteredData = filteredData.filter(item => item.status === selectedStatus);
    }

    if (search) {
      const searchTerm = search.toLowerCase();
      filteredData = filteredData.filter(item => 
        (item.israeliParticipant && item.israeliParticipant.toLowerCase().includes(searchTerm)) ||
        (item.diasporaParticipant && item.diasporaParticipant.toLowerCase().includes(searchTerm))
      );
    }

    // Pagination
    const paginatedData = paginate(filteredData);

    return {
      data: paginatedData,
      total: filteredData.length
    };
  }, [currentChavrutas, selectedYear, selectedTrack, selectedStatus, search, paginate]);

  // Add handler for notes click
  const handleNotesClick = (row: ChavrutaRow) => {
    const id = row.id;
    dashboard.openModal({
      modalId: MODAL_IDS.NOTES,
      params: { 
        userId: id,
        initialNote: row.deleteReason || '',
        readOnly: true,
        title: "Delete Reason"
      }
    });
  };

  const handleMailClick = (row: ChavrutaRow) => {
    // implement mail logic using row.id or row.participantData
  };

  // Update handleDeleteClick to open the delete modal
  const handleDeleteClick = (row: ChavrutaRow) => {
    dashboard.openModal({
      modalId: MODAL_IDS.DELETE_PAIR,
      params: {
        pairId: row.id,
        onDelete: async (pairId: string, reason: string) => {
          await handleDeletePair(pairId, reason);
        }
      }
    });
  };

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
      logger.error('Error updating status:', error);
    }
  };

  // Update handleTrackChange function
  const handleTrackChange = async (rowId: string, newTrack: string) => {
    try {
      logger.debug('Changing track for', rowId, 'to', newTrack);
      // Find track ID using PreferredTracksInfo
      const trackId = Object.values(PreferredTracksInfo).find(t => t.trackEn === newTrack)?.id;
      if (!trackId) {
        logger.error('Could not find track ID for track:', newTrack);
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
      logger.error('Error updating track:', error);
    }
  };
      

  // Update the handleDetailsClick function
  const handleDetailsClick = useCallback((row: any, e?: React.MouseEvent) => {
    if (e) { e.stopPropagation(); }
    logger.debug('handleDetailsClick called', { id: row?.id, activeLen: activeChavrutas.length, archivedLen: archivedChavrutas.length, currentLen: currentChavrutas.length });
    // use the provided row directly (no lookup)
    if (!row) {
      logger.error('No row provided to handleDetailsClick');
      return;
    }
    dashboard.openModal({
      modalId: MODAL_IDS.CHAVRUTA_DETAILS,
      params: {
        israeliParticipant: row.participantData?.israeli,
        diasporaParticipant: row.participantData?.diaspora,
        chavrutaId: row.id,
        initialNote: row.note
      }
    });
  }, [activeChavrutas, archivedChavrutas, currentChavrutas]);

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
          onClick: (row: ChavrutaRow) => handleNotesClick(row)
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
          onClick: (row: ChavrutaRow) => handleDetailsClick(row)
        },
        { 
          key: "mail",
          label: "",
          onClick: (row: ChavrutaRow) => handleMailClick(row)
        },
        { 
          key: "delete",
          label: "",
          onClick: (row: ChavrutaRow) => handleDeleteClick(row)
        }
      ];
    }
  }, [showArchived]);

  // Update filters to work with current data
  const filters = useMemo(() => {
    const years = Array.from(new Set(currentChavrutas.map((item: ChavrutaRow) => 
      new Date(item.matchDate).getFullYear().toString()
    ))).sort();

    const tracks = Array.from(new Set(currentChavrutas.map((item: ChavrutaRow) => item.track))).sort();
    
    // Use display labels as both ID and value
    const statuses = Object.values(PairStatus)
      .filter(status => typeof status === 'number')
      .map(status => {
        const label = PairStatusLabels[status as PairStatus];
        return {
          id: label, // Use label as ID
          value: label
        };
      });

    return {
      years: years.map(year => ({ id: year, value: year })),
      tracks: tracks.map(track => ({ id: track, value: track })),
      statuses
    };
  }, [currentChavrutas]);

  
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
              data={filteredAndPaginatedData.data}
              total={filteredAndPaginatedData.total}
              loading={loading}
              onSearch={handleSearchChange}  // Updated prop name
              onRowClick={handleDetailsClick}
              currentPage={currentPage}  // Add current page prop
              onPageChange={handlePageChange}  // Add page change handler
              pageSize={pageSize}  // Add page size prop
            />
          </div>
        </Page.Content>
      </Page>
    </WixDesignSystemProvider>
  );
};

export default DashboardPage;
