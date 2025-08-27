import React, { type FC, useState, useMemo } from 'react';
import { Page, WixDesignSystemProvider, Layout, Cell, Box, Text, ToggleSwitch } from '@wix/design-system';
import '@wix/design-system/styles.global.css';
import { GenericTable } from '../../../components/GenericTable';
import { fetchCMSData, getTracks } from '../../../data/cmsData';
import { Eye, Handshake } from 'lucide-react';
import { dashboard } from '@wix/dashboard';
import '../../../styles/matches.css';

interface User {
  id: string;
  fullName: string;
  country?: string;
  preferredTracks?: string[];
  learningTime?: string[];
  matchPercentage?: number;
  commonTracks?: string[];
}

const DashboardPage: FC = () => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [potentialMatches, setPotentialMatches] = useState<User[]>([]);
  const [showAllUsers, setShowAllUsers] = useState(false);
  const [showOnlyMatching, setShowOnlyMatching] = useState(false);

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

  const matchColumns = [
    { key: "fullName", label: "Full Name" },
    { key: "country", label: "Country" },
    { 
      key: "matchPercentage", 
      label: "Match %",
      render: (row: User) => <div>{row.matchPercentage || 0}%</div>
    },
    { 
      key: "commonTracks", 
      label: "Common Tracks",
      render: (row: User) => (
        <div>
          {row.commonTracks?.length 
            ? row.commonTracks.map((track, index) => (
                <Text key={index} size="small" weight="normal">
                  {track}{index < row.commonTracks!.length - 1 ? ', ' : ''}
                </Text>
              ))
            : <Text size="small">No common tracks</Text>
          }
        </div>
      )
    },
    {
      key: "pair",
      label: "create pairing",
     
      onClick: (id: string) => handlePair(id)
    }
  ];

  const fetchUsers = async (search: string, page: number, pageSize: number) => {
    const data = await fetchCMSData();
    console.log(data);
    const users = data?.map(user => ({
      id: user._id,
      fullName: user.fullName,
      country: user.country,
      preferredTracks: user["prefTra"] || [],
      learningTime: user.learningTime || [],
      havrutaFound: user.havrutaFound
    })) || [];

    const filteredByHavruta = showAllUsers 
      ? users 
      : users.filter(user => !user.havrutaFound);

    const filteredUsers = filteredByHavruta.filter(user => 
      user?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      (user.country || '').toLowerCase().includes(search?.toLowerCase())
    );

    return {
      data: filteredUsers.slice((page - 1) * pageSize, page * pageSize),
      total: filteredUsers.length,
    };
  };

  // Use useMemo for filtered matches
  const filteredMatches = useMemo(() => {
    if (!showOnlyMatching) return potentialMatches;
    return potentialMatches.filter(match => (match.matchPercentage || 0) > 50);
  }, [potentialMatches, showOnlyMatching]);

  // Update fetchPotentialMatches to use memoized filtered matches
  const fetchPotentialMatches = async (search: string, page: number, pageSize: number) => {
    const searchFiltered = filteredMatches.filter(match => 
      match?.fullName?.toLowerCase().includes(search?.toLowerCase()) ||
      (match?.country || '').toLowerCase().includes(search?.toLowerCase())
    );

    const start = (page - 1) * pageSize;
    const end = start + pageSize;

    return {
      data: searchFiltered.slice(start, end),
      total: searchFiltered.length,
    };
  };

  const handleUserSelect = async (userId: string) => {
    const [data, tracksData] = await Promise.all([
      fetchCMSData(),
      getTracks()
    ]);
    
    const selectedUser = data?.find(user => user._id === userId);
    if (selectedUser) {
      const userObj = {
        id: selectedUser._id,
        fullName: selectedUser.fullName,
        country: selectedUser.country,
        preferredTracks: selectedUser["prefTra"] || [],
        learningTime: selectedUser.learningTime || []
      };

      // Calculate matches with percentage and common tracks
      const matches = data
        ?.filter(user => user._id !== userId)
        ?.map(user => {
          // Calculate common tracks using the correct field name and convert to track names
          const commonTrackIds = user["prefTra"]?.filter(track => 
            userObj.preferredTracks?.includes(track)
          ) || [];

          // Convert track IDs to track names
          const commonTracks = commonTrackIds.map(trackId => {
            const track = tracksData.find(t => t.id === trackId);
            return track?.trackEn || "";
          }).join(', ');

          const matchPercentage = Math.floor(Math.random() * 100); // Placeholder for actual calculation

          return {
            id: user._id,
            fullName: user.fullName,
            country: user.country,
            preferredTracks: user["prefTra"] || [],
            learningTime: user.learningTime || [],
            matchPercentage,
            commonTracks
          };
        }) || [];

      console.log("matches:", matches);
      setSelectedUser(userObj);
      setPotentialMatches(matches);
    }
  };

  const handlePair = async (matchId: string) => {
    console.log(`Pairing ${selectedUser?.id} with ${matchId}`);
  };

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
                    fetchData={fetchUsers}
                    onRowClick={(id) => handleUserSelect(id)}
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
                      columns={matchColumns}
                      fetchData={fetchPotentialMatches}
                      pageSize={10}
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
