import React, { type FC, useState, useMemo, useCallback, useEffect } from 'react';
import { Page, WixDesignSystemProvider, Layout, Cell, Box, Text, ToggleSwitch } from '@wix/design-system';
import '@wix/design-system/styles.global.css';
import { GenericTable } from '../../../components/GenericTable';
import { createNewPairInDatabase, fetchMatchData, getTracks } from '../../../data/cmsData';
import { Eye, Handshake } from 'lucide-react';
import { dashboard } from '@wix/dashboard';
import '../../../styles/matches.css';
import {
  analyzeMatchCompatibility,
  calculateMatchPercentage,
  type MatchFailureReason,
} from '../../../data/matchLogic';
import { MODAL_IDS } from '../../../constants/modals';
import { useTablePagination } from '../../../hooks/useTablePagination';
import { createLogger } from '../../../utils/logger';
import type { LearningTime, Track } from '../../../types';

const logger = createLogger('matches-page');


interface User {
  id: string;
  fullName: string;
  country: string;
  gender?: string;
  prefGender?: string;
  skillLevel?: number;
  desiredSkillLevel?: number;
  englishLevel?: number;
  desiredEnglishLevel?: number;
  preferredTracks?: Array<string | number>;
  utcOffset?: string | number;
  learningStyle?: number;
  matchTo?: number;
  prefNumberOfMatches?: number;
  sunday?: LearningTime | string[];
  monday?: LearningTime | string[];
  tuesday?: LearningTime | string[];
  wednesday?: LearningTime | string[];
  thursday?: LearningTime | string[];
  matchPercentage?: number;
  commonTracks?: string[];
  havrutaFound?: boolean;
  isCompatible?: boolean;
  firstFailedReason?: MatchFailureReason | null;
  failedReasons?: MatchFailureReason[];
}

const FAILURE_REASON_LABELS: Record<MatchFailureReason, string> = {
  country: 'Country rule',
  gender: 'Gender preference mismatch',
  english: 'English level mismatch',
  tracks: 'No shared track',
  time: 'No time overlap',
  limit: 'Match limit reached',
};

const normalizeTrackIds = (trackIds?: Array<string | number>): number[] =>
  (trackIds || [])
    .map((trackId) => typeof trackId === 'number' ? trackId : Number.parseInt(trackId, 10))
    .filter((trackId) => Number.isInteger(trackId));

const normalizeLearningTime = (value?: LearningTime | string[]): LearningTime | undefined => {
  if (!value) {
    return undefined;
  }

  if (!Array.isArray(value)) {
    return value;
  }

  const normalizedValues = value.map((item) => item.toLowerCase());

  return {
    morning: normalizedValues.includes('morning'),
    noon: normalizedValues.includes('noon'),
    evening: normalizedValues.includes('evening'),
    lateNight: normalizedValues.includes('late night') || normalizedValues.includes('latenight'),
  };
};

const DashboardPage: FC = () => {
  // Single source of truth for data
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [potentialMatches, setPotentialMatches] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  
  // UI state
  const [showAllUsers, setShowAllUsers] = useState(false);
  const [showOnlyMatching, setShowOnlyMatching] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [matchSearchTerm, setMatchSearchTerm] = useState('');
  
  // Pagination state - separate for each table
  const {
    currentPage: usersCurrentPage,
    pageSize: usersPageSize,
    setCurrentPage: setUsersCurrentPage,
    paginate: paginateUsers
  } = useTablePagination({
    pageSize: 10,
    resetDependencies: [showAllUsers, searchTerm]
  });

  const {
    currentPage: matchesCurrentPage,
    pageSize: matchesPageSize,
    setCurrentPage: setMatchesCurrentPage,
    paginate: paginateMatches
  } = useTablePagination({
    pageSize: 10,
    resetDependencies: [showOnlyMatching, matchSearchTerm, selectedUser]
  });
  
  const [trackSelection, setTrackSelection] = useState<{[key: string]: string}>({});
  const [allTracks, setAllTracks] = useState<Track[]>([]);
  const [editableTrackRows, setEditableTrackRows] = useState<Set<string>>(new Set());

  // Fetch initial data
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      logger.debug('Fetching initial data...');
      const [userData, tracksData] = await Promise.all([
        fetchMatchData(),
        getTracks()
      ]);
      
      setAllTracks(tracksData);
      
      const formattedUsers = userData?.map(user => ({
        id: user._id,
        fullName: user.fullName,
        country: user.country || '',
        gender: user?.gender?.length ? user.gender[0] : undefined,
        prefGender: user?.prefGender?.length ? user.prefGender[0] : undefined,
        skillLevel: user.skillLevel,
        desiredSkillLevel: user.desiredSkillLevel,
        englishLevel: user.englishLevel,
        desiredEnglishLevel: user.desiredEnglishLevel,
        learningStyle: user.prefLearningStyle,
        preferredTracks: user.prefTracks || [],
        utcOffset: user.utcOffset,
        sunday: user.sunday,
        monday: user.monday,
        tuesday: user.tuesday,
        wednesday: user.wednesday,
        thursday: user.thursday,
        matchTo: user.matchTo,
        prefNumberOfMatches: user.prefNumberOfMatches,
        havrutaFound: (user.matchTo || 0) >= (user.prefNumberOfMatches || 1)
      })) || [];

      setAllUsers(formattedUsers);
      setLoading(false);
      logger.debug('Users loaded:', formattedUsers.length, 'items');
    } catch (error) {
      logger.error('Error fetching initial data:', error);
      setLoading(false);
    }
  };

  // Computed filtered data for users table
  const usersFilteredData = useMemo(() => {
    // Filter based on showAllUsers toggle
    let filtered = showAllUsers 
      ? allUsers 
      : allUsers.filter(user => !user.havrutaFound);

    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(user => 
        user?.fullName?.toLowerCase().includes(search) ||
        (user.country || '').toLowerCase().includes(search)
      );
    }

    return filtered;
  }, [allUsers, showAllUsers, searchTerm]);

  // Computed paginated data for users table
  const usersPaginatedData = useMemo(() => {
    return paginateUsers(usersFilteredData);
  }, [usersFilteredData, paginateUsers]);

  // Computed filtered data for matches table
  const matchesFilteredData = useMemo(() => {
    // Filter based on showOnlyMatching toggle
    let filtered = showOnlyMatching 
      ? potentialMatches.filter(match => match.isCompatible && (match.matchPercentage || 0) > 0)
      : potentialMatches;

    // Apply search filter
    if (matchSearchTerm) {
      const search = matchSearchTerm.toLowerCase();
      filtered = filtered.filter(match => 
        match?.fullName?.toLowerCase().includes(search) ||
        (match?.country || '').toLowerCase().includes(search)
      );
    }

    // Sort by match percentage in descending order (highest first)
    filtered = filtered.sort((a, b) => (b.matchPercentage || 0) - (a.matchPercentage || 0));

    return filtered;
  }, [potentialMatches, showOnlyMatching, matchSearchTerm]);

  // Computed paginated data for matches table
  const matchesPaginatedData = useMemo(() => {
    return paginateMatches(matchesFilteredData);
  }, [matchesFilteredData, paginateMatches]);

  const noMatchInsight = useMemo(() => {
    if (!selectedUser || potentialMatches.length === 0) {
      return null;
    }

    const compatibleCount = potentialMatches.filter(match => match.isCompatible).length;
    if (compatibleCount > 0) {
      return null;
    }

    const failureCounts = potentialMatches.reduce<Record<MatchFailureReason, number>>((accumulator, match) => {
      if (match.firstFailedReason) {
        accumulator[match.firstFailedReason] += 1;
      }

      return accumulator;
    }, {
      country: 0,
      gender: 0,
      english: 0,
      tracks: 0,
      time: 0,
      limit: 0,
    });

    const topReasons = Object.entries(failureCounts)
      .filter(([, count]) => count > 0)
      .sort((left, right) => right[1] - left[1])
      .slice(0, 3)
      .map(([reason, count]) => ({
        reason: reason as MatchFailureReason,
        count,
        percent: Math.round((count / potentialMatches.length) * 100),
      }));

    return {
      checkedCount: potentialMatches.length,
      topReasons,
    };
  }, [selectedUser, potentialMatches]);

  // Pagination handlers - separate for each table
  const handleUsersPageChange = useCallback((page: number) => {
    logger.debug("Users page changed to:", page);
    setUsersCurrentPage(page);
  }, []);

  const handleMatchesPageChange = useCallback((page: number) => {
    logger.debug("Matches page changed to:", page);
    setMatchesCurrentPage(page);
  }, []);

  // Search handlers - separate for each table
  const handleUsersSearch = useCallback((search: string) => {
    setSearchTerm(search);
  }, []);

  const handleMatchesSearch = useCallback((search: string) => {
    setMatchSearchTerm(search);
  }, []);

  // Event handlers
  const handleUserDetailsClick = useCallback((row: User) => {
    dashboard.openModal({
      modalId: MODAL_IDS.USER_DETAILS,
      params: { userId: row.id }
    });
  }, []);

  const handleMatchRowClick = useCallback((row: User) => {
    if (selectedUser && row) {
      dashboard.openModal({
        modalId: MODAL_IDS.MATCHES,
        params: { 
          selectedUserId: selectedUser.id,
          matchUserId: row.id
        }
      });
    }
  }, [selectedUser]);

  const handleUserSelect = useCallback(async (row: User) => {
    
    // Process ALL users except the selected one
    const allPotentialUsers = allUsers.filter(user => user.id !== row.id);
    const allMatches: User[] = [];

    for (const user of allPotentialUsers) {
      // Check compatibility for all users
      const rawSelectedUser = {
        _id: row.id,
        fullName: row.fullName,
        country: row.country,
        gender: row.gender || '',
        prefGender: row.prefGender,
        skillLevel: row.skillLevel,
        desiredSkillLevel: row.desiredSkillLevel,
        englishLevel: row.englishLevel,
        desiredEnglishLevel: row.desiredEnglishLevel,
        learningStyle: row.learningStyle,
        prefTracks: normalizeTrackIds(row.preferredTracks),
        utcOffset: row.utcOffset ?? '',
        sunday: normalizeLearningTime(row.sunday),
        monday: normalizeLearningTime(row.monday),
        tuesday: normalizeLearningTime(row.tuesday),
        wednesday: normalizeLearningTime(row.wednesday),
        thursday: normalizeLearningTime(row.thursday),
        matchTo: row.matchTo,
        prefNumberOfMatches: row.prefNumberOfMatches
      };

      const rawPotentialMatch = {
        _id: user.id,
        fullName: user.fullName,
        country: user.country,
        gender: user.gender || '',
        prefGender: user.prefGender,
        skillLevel: user.skillLevel,
        desiredSkillLevel: user.desiredSkillLevel,
        englishLevel: user.englishLevel,
        desiredEnglishLevel: user.desiredEnglishLevel,
        learningStyle: user.learningStyle,
        prefTracks: normalizeTrackIds(user.preferredTracks),
        utcOffset: user.utcOffset ?? '',
        sunday: normalizeLearningTime(user.sunday),
        monday: normalizeLearningTime(user.monday),
        tuesday: normalizeLearningTime(user.tuesday),
        wednesday: normalizeLearningTime(user.wednesday),
        thursday: normalizeLearningTime(user.thursday),
        matchTo: user.matchTo,
        prefNumberOfMatches: user.prefNumberOfMatches
      };

      const compatibilityAnalysis = analyzeMatchCompatibility(rawSelectedUser, rawPotentialMatch);
      const isCompatible = compatibilityAnalysis.isCompatible;
      const matchPercentage = isCompatible 
        ? calculateMatchPercentage(rawSelectedUser, rawPotentialMatch)
        : 0;

      // Calculate common tracks for display
      
      const userTracks = Array.isArray(user.preferredTracks) ? user.preferredTracks : [];
      const rowTracks = Array.isArray(row.preferredTracks) ? row.preferredTracks : [];

      const commonTrackIds = userTracks.filter(track => 
        rowTracks.includes(track)
      );

      const commonTracks = commonTrackIds.map(trackId => {
        const track = allTracks.find(t => t.id === trackId);
        return track?.trackEn || "";
      }).filter(t => t);

      // Add ALL users to the matches list
      allMatches.push({
        ...user,
        matchPercentage,
        commonTracks,
        isCompatible,
        firstFailedReason: compatibilityAnalysis.firstFailedReason,
        failedReasons: compatibilityAnalysis.failedReasons,
      });
    }

    logger.debug("All potential matches:", allMatches.length);
    logger.debug("Compatible matches:", allMatches.filter(m => m.isCompatible).length);
    
    // Clear track selections and editable rows when selecting a new user
    setTrackSelection({});
    setEditableTrackRows(new Set());
    setSelectedUser(row);
    setPotentialMatches(allMatches);
    // Reset matches pagination when selecting new user
    setMatchesCurrentPage(1);
  }, [allUsers, allTracks]);

  const handlePairWithTrack = useCallback(async (matchId: string, trackName: string, trackId: string) => {
    if (!selectedUser) {
      logger.error('No user selected for pairing');
      return;
    }

    const targetUser = potentialMatches.find(user => user.id === matchId);
    if (!targetUser) {
      logger.error('Target user not found');
      return;
    }

    logger.debug("Selected user:", selectedUser.country, "Target user:", targetUser.country);
    
    // Determine who is Israeli and who is not based on country
    const isSelectedUserIsraeli = selectedUser.country?.toLowerCase() === 'israel';
    const isTargetUserIsraeli = targetUser.country?.toLowerCase() === 'israel';

    let sourceUserId: string;
    let sourceUserName: string;
    let targetUserId: string;
    let targetUserName: string;

    // If one user is Israeli and the other is not, Israeli should be source
    if (isSelectedUserIsraeli && !isTargetUserIsraeli) {
      sourceUserId = selectedUser.id;
      sourceUserName = selectedUser.fullName;
      targetUserId = targetUser.id;
      targetUserName = targetUser.fullName;
    } else if (!isSelectedUserIsraeli && isTargetUserIsraeli) {
      sourceUserId = targetUser.id;
      sourceUserName = targetUser.fullName;
      targetUserId = selectedUser.id;
      targetUserName = selectedUser.fullName;
    } else {
      // If both are Israeli or both are non-Israeli, keep original order
      sourceUserId = selectedUser.id;
      sourceUserName = selectedUser.fullName;
      targetUserId = targetUser.id;
      targetUserName = targetUser.fullName;
    }

    logger.debug(`Creating pair: ${sourceUserName} and ${targetUserName} for track: ${trackName} (ID: ${trackId})`);
    
    try {
      await createNewPairInDatabase(sourceUserId, targetUserId, trackId);
      
      // Refresh data after successful pairing
      await fetchInitialData();
      
      // Clear selections
      setTrackSelection(prev => {
        const newSelection = { ...prev };
        delete newSelection[matchId];
        return newSelection;
      });
      
      setEditableTrackRows(prev => {
        const newSet = new Set(prev);
        newSet.delete(matchId);
        return newSet;
      });

      dashboard.showToast({
        message: 'Pair created successfully!',
        type: 'success'
      });
    } catch (error) {
      logger.error('Error creating pair:', error);
      dashboard.showToast({
        message: 'Error creating pair. Please try again.',
        type: 'error'
      });
    }
  }, [selectedUser, potentialMatches]);

  const handlePairClick = useCallback((row: User) => {
    const targetUser = potentialMatches.find(user => user.id === row.id);
    if (!targetUser) {
      logger.debug('Target user not found');
      return;
    }
    
    const commonTracks = targetUser.commonTracks || [];
    
    if (commonTracks.length === 1) {
      // Single common track - proceed directly
      const selectedTrack = commonTracks[0];
      const track = allTracks.find(t => t.trackEn === selectedTrack);
      const trackId = track?.id?.toString() || '1';
      handlePairWithTrack(row.id, selectedTrack, trackId);
    } else {
      // No common tracks or multiple tracks - make the track column editable
      logger.debug('Making row editable for track selection');
      
      if (allTracks.length === 0) {
        dashboard.showToast({
          message: 'No tracks available. Please select a user first.',
          type: 'error'
        });
        return;
      }
      
      setEditableTrackRows(prev => {
        const newSet = new Set(prev);
        newSet.add(row.id);
        return newSet;
      });
      
      dashboard.showToast({
        message: commonTracks.length === 0 
          ? 'Now select any track from the dropdown in the tracks column'
          : 'Now select one of the common tracks from the dropdown in the tracks column',
        type: 'standard'
      });
    }
  }, [potentialMatches, allTracks, handlePairWithTrack]);

  // Define columns with row-based onClick handlers
  const userColumns = useMemo(() => [
    { key: "fullName", label: "Full Name" },
    { key: "country", label: "Country" },
    { 
      key: "details",
      label: "",
      onClick: (row: User) => handleUserDetailsClick(row)
    }
  ], [handleUserDetailsClick]);

  const matchColumns = useMemo(() => [
    { key: "fullName", label: "Full Name" },
    { key: "country", label: "Country" },
    {
      key: "blocker",
      label: "First Blocker",
      render: (row: User) => {
        if (row.isCompatible) {
          return showOnlyMatching ? '' : 'Matchable';
        }

        return row.firstFailedReason ? FAILURE_REASON_LABELS[row.firstFailedReason] : 'Unknown';
      }
    },
    { 
      key: "matchPercentage", 
      label: "Match %"
    },
    { 
      key: "commonTracks", 
      label: "Common Tracks / Select Track",
      render: (row: User) => {
        const commonTracks = row.commonTracks || [];
        return commonTracks.join(', ');
      },
      editable: (row: User) => {
        const isEditable = editableTrackRows.has(row.id);
        
        if (!isEditable || allTracks.length === 0) {
          return undefined;
        }

        const commonTracks = row.commonTracks || [];
        let options = [{ value: '', label: 'Choose a track' }];
        
        if (commonTracks.length === 0) {
          options.push(...allTracks.map((track) => ({ 
            value: track.id.toString(), 
            label: track.trackEn 
          })));
        } else {
          const commonTrackOptions = commonTracks.map(trackName => {
            const track = allTracks.find(t => t.trackEn === trackName);
            return {
              value: track?.id.toString() || trackName,
              label: trackName
            };
          });
          options.push(...commonTrackOptions);
        }
        
        return {
          options: options,
          onSelect: (rowId: string, value: string) => {
            if (!value || value === '') {
              logger.debug('Empty value selected, ignoring');
              return;
            }
            
            if (!editableTrackRows.has(rowId)) {
              return;
            }

            const targetUser = potentialMatches.find(user => user.id === rowId);
            if (!targetUser) {
              logger.debug('Target user not found');
              return;
            }

            const commonTracks = targetUser.commonTracks || [];
            
            if (commonTracks.length > 0) {
              const selectedTrack = allTracks.find(t => t.id.toString() === value);
              if (selectedTrack && !commonTracks.includes(selectedTrack.trackEn)) {
                dashboard.showToast({
                  message: 'Please select one of the common tracks only',
                  type: 'error'
                });
                return;
              }
            }

            setTrackSelection(prev => ({
              ...prev,
              [rowId]: value
            }));

            const trackId = value;
            const track = allTracks.find(t => t.id.toString() === trackId);
            const trackName = track?.trackEn || `Track ${trackId}`;
            
            setEditableTrackRows(prev => {
              const newSet = new Set(prev);
              newSet.delete(rowId);
              return newSet;
            });
            
            handlePairWithTrack(rowId, trackName, trackId);
          }
        };
      }
    },
    {
      key: "pair",
      label: "Create Pairing",
      onClick: (row: User) => handlePairClick(row)
    }
  ], [allTracks, editableTrackRows, potentialMatches, handlePairWithTrack, handlePairClick, showOnlyMatching]);

  return (
    <WixDesignSystemProvider features={{ newColorsBranding: true }}>
      <Page>
        <Page.Header
          title="Match Users"
          subtitle="Select a user to see potential matches"
        />
        <Page.Content>
          <Layout>
            <Cell span={6}>
              <Box direction="vertical">
                <Box marginBottom="24px" align="center" direction="vertical">
                  <Box marginBottom="12px">
                    <Text weight="bold" size="medium">
                      Available Users
                    </Text>
                  </Box>
                  <Box>
                    <Box direction="horizontal" verticalAlign="middle">
                      <Text size="small" weight="bold" marginRight="24px">
                        Without Chavruta
                      </Text>
                      <Box marginLeft="12px" marginRight="12px">
                        <ToggleSwitch
                          checked={showAllUsers}
                          onChange={() => setShowAllUsers(prev => !prev)}
                          size="small"
                        />
                      </Box>
                      <Text size="small" weight="bold" marginLeft="24px">
                        All Users
                      </Text>
                    </Box>
                  </Box>
                </Box>
                <Box>
                  <GenericTable
                    columns={userColumns}
                    data={usersPaginatedData}
                    total={usersFilteredData.length}
                    loading={loading}
                    onSearch={handleUsersSearch}
                    onRowClick={(row) => handleUserSelect(row)}
                    selectedRowId={selectedUser?.id}
                    currentPage={usersCurrentPage}
                    onPageChange={handleUsersPageChange}
                    pageSize={usersPageSize}
                  />
                </Box>
              </Box>
            </Cell>
            <Cell span={6}>
              <Box direction="vertical">
                <Box marginBottom="24px" align="center" direction="vertical">
                  <Box marginBottom="12px">
                    <Text weight="bold" size="medium">
                      {selectedUser 
                        ? `Potential Matches for ${selectedUser.fullName}`
                        : 'Potential Matches'
                      }
                    </Text>
                  </Box>
                  <Box>
                    <Box direction="horizontal" verticalAlign="middle">
                      <Text size="small" weight="bold" marginRight="24px">
                        All Available
                      </Text>
                      <Box marginLeft="12px" marginRight="12px">
                        <ToggleSwitch
                          checked={showOnlyMatching}
                          onChange={() => setShowOnlyMatching(prev => !prev)}
                          size="small"
                        />
                      </Box>
                      <Text size="small" weight="bold" marginLeft="24px">
                        Matching Only
                      </Text>
                    </Box>
                  </Box>
                </Box>
                <Box>
                  {selectedUser ? (
                    <>
                      {noMatchInsight ? (
                        <Box marginBottom="16px">
                          <div className="match-insight-card">
                            <div className="match-insight-title">Blocking reasons</div>
                            <div className="match-insight-subtitle">
                              Checked {noMatchInsight.checkedCount} candidates for {selectedUser.fullName}. Each candidate is counted once by its first blocking rule.
                            </div>
                            <div className="match-insight-list">
                              {noMatchInsight.topReasons.map((item) => (
                                <div key={item.reason} className="match-insight-item">
                                  <span className="match-insight-label">{FAILURE_REASON_LABELS[item.reason]}</span>
                                  <span className="match-insight-value">{item.count} blocked ({item.percent}%)</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </Box>
                      ) : null}
                      <GenericTable
                        columns={matchColumns}
                        data={matchesPaginatedData}
                        total={matchesFilteredData.length}
                        loading={false}
                        onSearch={handleMatchesSearch}
                        onRowClick={handleMatchRowClick}
                        currentPage={matchesCurrentPage}
                        onPageChange={handleMatchesPageChange}
                        pageSize={matchesPageSize}
                      />
                    </>
                  ) : (
                    <Box padding="20px" align="center">
                      Select a user to see potential matches
                    </Box>
                  )}
                </Box>
              </Box>
            </Cell>
          </Layout>
        </Page.Content>
      </Page>
    </WixDesignSystemProvider>
  );
};

export default DashboardPage;
