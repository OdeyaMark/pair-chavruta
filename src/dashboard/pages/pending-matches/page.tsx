import React, { type FC, useState, useCallback, useEffect, useMemo } from 'react';
import { Page, WixDesignSystemProvider, Box } from '@wix/design-system';
import '@wix/design-system/styles.global.css';
import { GenericTable } from '../../../components/GenericTable';
import { fetchPendingChavrutasFromCMS, deleteChavrutaAndUpdateUsers } from '../../../data/cmsData';
import { PreferredTracksInfo } from '../../../constants/tracks';
import { dashboard } from '@wix/dashboard';

// Interface for the pending match data
interface PendingMatch {
  id: string;
  israeliParticipant: string;
  diasporaParticipant: string;
  track: string;
  israeliId: string;
  diasporaId: string;
  israeliName: string;
  diasporaName: string;
}

const DashboardPage: FC = () => {
  // Single source of truth for pending matches data
  const [pendingMatches, setPendingMatches] = useState<PendingMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Fetch data once on component mount
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      console.log('Fetching pending matches data...');
      const chavrutas = await fetchPendingChavrutasFromCMS();
      
      const formattedMatches = chavrutas.map(chavruta => {
        const track = Object.values(PreferredTracksInfo)
          .find(t => t.id === chavruta.track);

        return {
          id: chavruta._id,
          israeliParticipant: chavruta.newFromIsraelId?.fullName || 'Unknown',
          diasporaParticipant: chavruta.newFromWorldId?.fullName || 'Unknown',
          track: track?.trackEn || 'Unknown Track',
          israeliId: chavruta.newFromIsraelId?._id || '',
          diasporaId: chavruta.newFromWorldId?._id || '',
          israeliName: chavruta.newFromIsraelId?.fullName || 'Unknown',
          diasporaName: chavruta.newFromWorldId?.fullName || 'Unknown'
        };
      });

      setPendingMatches(formattedMatches);
      setLoading(false);
      console.log('Pending matches loaded:', formattedMatches.length, 'items');
    } catch (error) {
      console.error('Error fetching pending matches:', error);
      setLoading(false);
    }
  };

  // Add handler for page change
  const handlePageChange = useCallback((page: number) => {
    console.log("Page changed to:", page);
    setCurrentPage(page);
  }, []);

  // Add handler for search
  const handleSearchChange = useCallback((search: string) => {
    setSearchTerm(search);
    setCurrentPage(1); // Reset to page 1 on new search
  }, []);

  // Computed filtered and paginated data
  const displayData = useMemo(() => {
    let filtered = pendingMatches;

    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = pendingMatches.filter(match =>
        match.israeliParticipant.toLowerCase().includes(search) ||
        match.diasporaParticipant.toLowerCase().includes(search) 
      );
    }

    // Apply pagination
    const startIdx = (currentPage - 1) * pageSize;
    const paginatedData = filtered.slice(startIdx, startIdx + pageSize);

    return {
      data: paginatedData,
      total: filtered.length
    };
  }, [pendingMatches, searchTerm, currentPage]);

  // Event handlers that update the single source of truth
  const handleActivate = useCallback(async (row: PendingMatch) => {
    console.log('Activating pair with ID:', row.id);

    dashboard.openModal({
      modalId: '66aac142-762d-4489-a349-94be53e515c4',
      params: { 
        chavrutaId: row.id,
        sourceUserId: row.israeliId,
        sourceUserName: row.israeliName,
        targetUserId: row.diasporaId,
        targetUserName: row.diasporaName,
        trackId: row.track,
        trackName: row.track
      },
    });

    // Refresh data after activation
    setTimeout(async () => {
      console.log('Refreshing data after activation...');
      await fetchInitialData();
    }, 1000);
  }, []);

  const handleDiscard = useCallback(async (row: PendingMatch) => {
    // Show confirmation dialog
    const confirmed = window.confirm(
      `Are you sure you want to discard the pending match between ${row.israeliName} and ${row.diasporaName}? This will update their match counts.`
    );

    if (!confirmed) return;

    try {
      console.log('Discarding pending match:', row.id);
      
      // Optimistic update - remove from UI immediately
      setPendingMatches(prev => prev.filter(match => match.id !== row.id));
      
      // Update database in background
      await deleteChavrutaAndUpdateUsers(row.id);

      dashboard.showToast({
        message: 'Pending match discarded successfully. User match counts have been updated.',
        type: 'success'
      });

    } catch (error) {
      console.error('Error discarding match:', error);
      // Revert optimistic update on error
      await fetchInitialData();
      
      dashboard.showToast({
        message: 'Error discarding match. Please try again.',
        type: 'error'
      });
    }
  }, []);

  // Define columns with row-based onClick handlers
  const columns = useMemo(() => [
    { key: "israeliParticipant", label: "Israeli Participant" },
    { key: "diasporaParticipant", label: "Diaspora Participant" },
    { key: "track", label: "Track" },
    {
      key: "activate",
      label: "activate",
      onClick: (row: PendingMatch) => handleActivate(row),
    },
    {
      key: "discard", 
      label: "discard",
      onClick: (row: PendingMatch) => handleDiscard(row),
    }
  ], [handleActivate, handleDiscard]);

  return (
    <WixDesignSystemProvider features={{ newColorsBranding: true }}>
      <Page>
        <Page.Header
          title="Pending Matches"
          subtitle="Review and manage pending matches"
        />
        <Page.Content>
          <Box>
            <GenericTable
              columns={columns}
              data={displayData.data}              // Paginated data
              total={displayData.total}            // Total filtered count
              loading={loading}
              onSearch={handleSearchChange}        // Updated to reset page
              onRowClick={(row) => handleActivate(row)}
              currentPage={currentPage}            // Add current page prop
              onPageChange={handlePageChange}      // Add page change handler
              pageSize={pageSize}                  // Add page size prop
            />
          </Box>
        </Page.Content>
      </Page>
    </WixDesignSystemProvider>
  );
};

export default DashboardPage;
