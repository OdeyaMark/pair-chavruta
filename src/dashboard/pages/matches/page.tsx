import React, { type FC, useState, useMemo, useCallback, useEffect } from 'react';
import { Page, WixDesignSystemProvider, Layout, Cell, Box, Text, ToggleSwitch } from '@wix/design-system';
import '@wix/design-system/styles.global.css';
import { GenericTable } from '../../../components/GenericTable';
import { createNewPairInDatabase, fetchMatchData, getTracks } from '../../../data/cmsData';
import { Eye, Handshake } from 'lucide-react';
import { dashboard } from '@wix/dashboard';
import '../../../styles/matches.css';
import { checkUserCompatibilityDebug, calculateMatchPercentage } from '../../../data/matchLogic';

interface User {
  id: string;
  fullName: string;
  country?: string;
  gender?: string;
  prefGender?: string;
  skillLevel?: number;
  desiredSkillLevel?: number;
  englishLevel?: number;
  desiredEnglishLevel?: number;
  preferredTracks?: number[];
  utcOffset?: number;
  learningStyle?: number;
  matchTo?: number;
  prefNumberOfMatches?: number;
  sunday?: { morning: boolean; noon: boolean; evening: boolean; lateNight: boolean; };
  monday?: { morning: boolean; noon: boolean; evening: boolean; lateNight: boolean; };
  tuesday?: { morning: boolean; noon: boolean; evening: boolean; lateNight: boolean; };
  wednesday?: { morning: boolean; noon: boolean; evening: boolean; lateNight: boolean; };
  thursday?: { morning: boolean; noon: boolean; evening: boolean; lateNight: boolean; };
  matchPercentage?: number;
  commonTracks?: string[];
  havrutaFound?: boolean;
  isCompatible?: boolean;
}

const DashboardPage: FC = () => {
  // Single source of truth for data
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [potentialMatches, setPotentialMatches] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  
  // UI state
  const [showAllUsers, setShowAllUsers] = useState(false);
  const [showOnlyMatching, setShowOnlyMatching] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [matchSearchTerm, setMatchSearchTerm] = useState('');
  const [trackSelection, setTrackSelection] = useState<{[key: string]: string}>({});
  const [allTracks, setAllTracks] = useState<Array<{id: number, trackEn: string}>>([]);
  const [editableTrackRows, setEditableTrackRows] = useState<Set<string>>(new Set());

  // Fetch initial data
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      console.log('Fetching initial data...');
      const [userData, tracksData] = await Promise.all([
        fetchMatchData(),
        getTracks()
      ]);
      
      setAllTracks(tracksData);
      
      const formattedUsers = userData?.map(user => ({
        id: user._id,
        fullName: user.fullName,
        country: user.country,
        gender: user?.gender?.length ? user.gender[0] : undefined,
        prefGender: user?.prefGender?.length ? user.prefGender[0] : undefined,
        skillLevel: user.skillLevel,
        desiredSkillLevel: user.desiredSkillLevel,
        englishLevel: user.englishLevel,
        desiredEnglishLevel: user.desiredEnglishLevel,
        learningStyle: user.learningStyle,
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
      console.log('Users loaded:', formattedUsers.length, 'items');
    } catch (error) {
      console.error('Error fetching initial data:', error);
      setLoading(false);
    }
  };

  // Computed display data for users table
  const usersDisplayData = useMemo(() => {
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

  // Computed display data for matches table
  const matchesDisplayData = useMemo(() => {
    // Filter based on showOnlyMatching toggle
    let filtered = showOnlyMatching 
      ? potentialMatches.filter(match => (match.matchPercentage || 0) > 50)
      : potentialMatches;

    // Apply search filter
    if (matchSearchTerm) {
      const search = matchSearchTerm.toLowerCase();
      filtered = filtered.filter(match => 
        match?.fullName?.toLowerCase().includes(search) ||
        (match?.country || '').toLowerCase().includes(search)
      );
    }

    return filtered;
  }, [potentialMatches, showOnlyMatching, matchSearchTerm]);

  // Event handlers
  const handleUserDetailsClick = useCallback((row: User) => {
    dashboard.openModal({
      modalId: '45308f7c-1309-42a3-8a0b-00611cab9ebe',
      params: { userId: row.id }
    });
  }, []);

  const handleUserSelect = useCallback(async (row: User) => {
    console.log('Selecting user:', row.fullName);
    
    // Process ALL users except the selected one
    const allPotentialUsers = allUsers.filter(user => user.id !== row.id);
    const allMatches: User[] = [];

    for (const user of allPotentialUsers) {
      // Check compatibility for all users
      const rawSelectedUser = {
        _id: row.id,
        fullName: row.fullName,
        country: row.country,
        gender: row.gender ? [row.gender] : undefined,
        prefGender: row.prefGender ? [row.prefGender] : undefined,
        skillLevel: row.skillLevel,
        desiredSkillLevel: row.desiredSkillLevel,
        englishLevel: row.englishLevel,
        desiredEnglishLevel: row.desiredEnglishLevel,
        learningStyle: row.learningStyle,
        prefTracks: row.preferredTracks || [],
        utcOffset: row.utcOffset,
        sunday: row.sunday,
        monday: row.monday,
        tuesday: row.tuesday,
        wednesday: row.wednesday,
        thursday: row.thursday,
        matchTo: row.matchTo,
        prefNumberOfMatches: row.prefNumberOfMatches
      };

      const rawPotentialMatch = {
        _id: user.id,
        fullName: user.fullName,
        country: user.country,
        gender: user.gender ? [user.gender] : undefined,
        prefGender: user.prefGender ? [user.prefGender] : undefined,
        skillLevel: user.skillLevel,
        desiredSkillLevel: user.desiredSkillLevel,
        englishLevel: user.englishLevel,
        desiredEnglishLevel: user.desiredEnglishLevel,
        learningStyle: user.learningStyle,
        prefTracks: user.preferredTracks || [],
        utcOffset: user.utcOffset,
        sunday: user.sunday,
        monday: user.monday,
        tuesday: user.tuesday,
        wednesday: user.wednesday,
        thursday: user.thursday,
        matchTo: user.matchTo,
        prefNumberOfMatches: user.prefNumberOfMatches
      };

      const isCompatible = checkUserCompatibilityDebug(rawSelectedUser, rawPotentialMatch);
      const matchPercentage = isCompatible 
        ? calculateMatchPercentage(rawSelectedUser, rawPotentialMatch)
        : 0;

      // Calculate common tracks for display
      const commonTrackIds = user.preferredTracks?.filter(track => 
        row.preferredTracks?.includes(track)
      ) || [];

      const commonTracks = commonTrackIds.map(trackId => {
        const track = allTracks.find(t => t.id === trackId);
        return track?.trackEn || "";
      }).filter(t => t);

      // Add ALL users to the matches list
      allMatches.push({
        ...user,
        matchPercentage,
        commonTracks,
        isCompatible
      });
    }

    console.log("All potential matches:", allMatches.length);
    console.log("Compatible matches:", allMatches.filter(m => m.isCompatible).length);
    
    // Clear track selections and editable rows when selecting a new user
    setTrackSelection({});
    setEditableTrackRows(new Set());
    setSelectedUser(row);
    setPotentialMatches(allMatches);
  }, [allUsers, allTracks]);

  const handlePairWithTrack = useCallback(async (matchId: string, trackName: string, trackId: string) => {
    if (!selectedUser) {
      console.error('No user selected for pairing');
      return;
    }

    const targetUser = potentialMatches.find(user => user.id === matchId);
    if (!targetUser) {
      console.error('Target user not found');
      return;
    }

    console.log("Selected user:", selectedUser.country, "Target user:", targetUser.country);
    
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

    console.log(`Creating pair: ${sourceUserName} and ${targetUserName} for track: ${trackName} (ID: ${trackId})`);
    
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
      console.error('Error creating pair:', error);
      dashboard.showToast({
        message: 'Error creating pair. Please try again.',
        type: 'error'
      });
    }
  }, [selectedUser, potentialMatches]);

  const handlePairClick = useCallback((row: User) => {
    const targetUser = potentialMatches.find(user => user.id === row.id);
    if (!targetUser) {
      console.log('Target user not found');
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
      console.log('Making row editable for track selection');
      
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

  const userColumns = [
    { key: "fullName", label: "Full Name" },
    { key: "country", label: "Country" },
    { 
      key: "details",
      label: "",
      render: () => (
        <div className="icon-cell">
          <Eye size={20} className="action-icon" />
        </div>
      ),
      onClick: (id: string) => {
        dashboard.openModal({
          modalId: '45308f7c-1309-42a3-8a0b-00611cab9ebe',
          params: { userId: id }
        });
      }
    }
  ];

  // Create matchColumns as a useMemo that updates when dependencies change
  const matchColumns = useMemo(() => [
    { key: "fullName", label: "Full Name" },
    { key: "country", label: "Country" },
    { 
      key: "matchPercentage", 
      label: "Match %",
      render: (row: User) => <div>{row.matchPercentage || 0}%</div>
    },
    { 
      key: "commonTracks", 
      label: "Common Tracks / Select Track",
      render: (row: User) => {
        const commonTracks = row.commonTracks || [];
        const isEditable = editableTrackRows.has(row.id);
        const selectedTrack = trackSelection[row.id];
        
        if (isEditable && selectedTrack) {
          const track = allTracks.find(t => t.id.toString() === selectedTrack);
          return <Text size="small" color="#4caf50">Selected: {track?.trackEn || selectedTrack}</Text>;
        } else if (isEditable) {
          return <Text size="small" color="#2196f3">👆 Select track from dropdown above</Text>;
        } else if (commonTracks.length === 0) {
          return <Text size="small" color="#ff9800">No common tracks</Text>;
        } else if (commonTracks.length === 1) {
          return <Text size="small" color="#4caf50">{commonTracks[0]}</Text>;
        } else {
          return <Text size="small" color="#2196f3">{commonTracks.join(', ')}</Text>;
        }
      },
      // Make editable conditional per row
      editable: (row: User) => {
        const isEditable = editableTrackRows.has(row.id);
        
        if (!isEditable || allTracks.length === 0) {
          return undefined; // Not editable
        }

        const commonTracks = row.commonTracks || [];
        let options = [{ value: '', label: 'Choose a track' }];
        
        if (commonTracks.length === 0) {
          // Show all tracks
          options.push(...allTracks.map((track) => ({ 
            value: track.id.toString(), 
            label: track.trackEn 
          })));
        } else {
          // Show only common tracks
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
            // If user selected the placeholder option, don't proceed
            if (!value || value === '') {
              console.log('Empty value selected, ignoring');
              return;
            }
            
            if (!editableTrackRows.has(rowId)) {
              return;
            }

            const targetUser = potentialMatches.find(user => user.id === rowId);
            if (!targetUser) {
              console.log('Target user not found');
              return;
            }

            const commonTracks = targetUser.commonTracks || [];
            
            // Validate selection based on common tracks
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

            // Get track info - FIXED: Use the value directly as trackId
            const trackId = value;
            const track = allTracks.find(t => t.id === trackId);
            const trackName = track?.trackEn || `Track ${trackId}`;
            
            
            // Remove from editable rows
            setEditableTrackRows(prev => {
              const newSet = new Set(prev);
              newSet.delete(rowId);
              return newSet;
            });
            
            // Proceed with pairing - FIXED: Use trackId instead of track.id
            handlePairWithTrack(rowId, trackName, trackId);
          }
        };
      }
    },
    {
      key: "pair",
      label: "Create Pairing",
      render: (row: User) => {
        const isEditable = editableTrackRows.has(row.id);
        
        if (isEditable) {
          return (
            <div className="icon-cell">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setEditableTrackRows(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(row.id);
                    return newSet;
                  });
                  setTrackSelection(prev => {
                    const newSelection = { ...prev };
                    delete newSelection[row.id];
                    return newSelection;
                  });
                }}
                style={{
                  background: '#ff5722',
                  color: 'white',
                  border: 'none',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                Cancel
              </button>
            </div>
          );
        }
        
        return (
          <div className="icon-cell">
            <Handshake 
              size={20} 
              className="action-icon"
              style={{ 
                opacity: 1,
                cursor: 'pointer'
              }}
            />
          </div>
        );
      },
      onClick: (id: string) => {
        
        const targetUser = potentialMatches.find(user => user.id === id);
        if (!targetUser) {
          console.log('Target user not found');
          return;
        }
        
        const commonTracks = targetUser.commonTracks || [];
        
        if (commonTracks.length === 1) {
          // Single common track - proceed directly
          const selectedTrack = commonTracks[0];
          const track = allTracks.find(t => t.trackEn === selectedTrack);
          const trackId = track?.id || 1;
          handlePairWithTrack(id, selectedTrack, trackId);
        } else {
          // No common tracks or multiple tracks - make the track column editable
          console.log('Making row editable for track selection');
          
          if (allTracks.length === 0) {
            dashboard.showToast({
              message: 'No tracks available. Please select a user first.',
              type: 'error'
            });
            return;
          }
          
          setEditableTrackRows(prev => {
            const newSet = new Set(prev);
            newSet.add(id);
            console.log('Updated editable rows:', newSet);
            return newSet;
          });
          
          dashboard.showToast({
            message: commonTracks.length === 0 
              ? 'Now select any track from the dropdown in the tracks column'
              : 'Now select one of the common tracks from the dropdown in the tracks column',
            type: 'standard'
          });
        }
      }
    }
  ], [allTracks, editableTrackRows, trackSelection, potentialMatches]); // Dependencies that trigger re-render

  const fetchUsers = useCallback(async (search: string, page: number, pageSize: number) => {
    const data = await fetchMatchData();
    console.log("Fetched users:", data ); 
    const users = data?.map(user => ({
      id: user._id,
      fullName: user.fullName,
      country: user.country,
      gender: user?.gender?.length ? user.gender[0] : undefined,
      prefGender: user?.prefGender?.length ? user.prefGender[0] : undefined,
      skillLevel: user.skillLevel,
      desiredSkillLevel: user.desiredSkillLevel,
      englishLevel: user.englishLevel,
      desiredEnglishLevel: user.desiredEnglishLevel,
      learningStyle: user.learningStyle,
      preferredTracks: user.prefTracks || [],
      utcOffset: user.utcOffset,
      // UPDATED - use flat day structure
      sunday: user.sunday,
      monday: user.monday,
      tuesday: user.tuesday,
      wednesday: user.wednesday,
      thursday: user.thursday,
      matchTo: user.matchTo,
      prefNumberOfMatches: user.prefNumberOfMatches,
      havrutaFound: (user.matchTo || 0) >= (user.prefNumberOfMatches || 1)
    })) || [];

    // Filter based on showAllUsers toggle
    const filteredByHavruta = showAllUsers 
      ? users 
      : users.filter(user => !user.havrutaFound);

    // Apply search filter
    const filteredUsers = filteredByHavruta.filter(user => 
      user?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      (user.country || '').toLowerCase().includes(search?.toLowerCase())
    );

    return {
      data: filteredUsers.slice((page - 1) * pageSize, page * pageSize),
      total: filteredUsers.length,
    };
  }, [showAllUsers]);

  // Separate fetch function for potential matches table
  const fetchPotentialMatches = useCallback(async (search: string, page: number, pageSize: number) => {
    // Apply showOnlyMatching filter
    const baseMatches = showOnlyMatching 
      ? potentialMatches.filter(match => (match.matchPercentage || 0) > 50)
      : potentialMatches;

    // Apply search filter
    const searchFiltered = baseMatches.filter(match => 
      match?.fullName?.toLowerCase().includes(search?.toLowerCase()) ||
      (match?.country || '').toLowerCase().includes(search?.toLowerCase())
    );

    const start = (page - 1) * pageSize;
    const end = start + pageSize;

    return {
      data: searchFiltered.slice(start, end),
      total: searchFiltered.length,
    };
  }, [potentialMatches, showOnlyMatching]);

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
                    key={`users-${showAllUsers}`}
                    columns={userColumns}
                    data={usersDisplayData}
                    onRowClick={(id) => handleUserSelect(id)}
                    selectedRowId={selectedUser?.id}
                    loading={loading}
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
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
                    <GenericTable
                      key={`matches-${showOnlyMatching}-${selectedUser.id}-${editableTrackRows.size}-${allTracks.length}`}
                      columns={matchColumns}
                      data={matchesDisplayData}
                      pageSize={10}
                      loading={loading}
                      searchTerm={matchSearchTerm}
                      setSearchTerm={setMatchSearchTerm}
                    />
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
