import React, { type FC, useState } from 'react';
import { Page, WixDesignSystemProvider, Box } from '@wix/design-system';
import '@wix/design-system/styles.global.css';
import { GenericTable } from '../../../components/GenericTable';
import { fetchChavrutasFromCMS, fetchPendingChavrutasFromCMS, updateChavrutaBase } from '../../../data/cmsData';
import { Check, X } from 'lucide-react';
import { PairStatus } from '../../../constants/status';

const DashboardPage: FC = () => {
  const columns = [
    { key: "israeliParticipant", label: "Israeli Participant" },
    { key: "diasporaParticipant", label: "Diaspora Participant" },
    { key: "track", label: "Track" },
    {
      key: "activate",
      label: "",
      render: () => (
        <div className="icon-cell">
          <Check size={20} className="action-icon success" />
        </div>
      ),
      onClick: (id: string) => handleActivate(id)
    },
    {
      key: "discard",
      label: "",
      render: () => (
        <div className="icon-cell">
          <X size={20} className="action-icon danger" />
        </div>
      ),
      onClick: (id: string) => handleDiscard(id)
    }
  ];

  const fetchPendingMatches = async (search: string, page: number, pageSize: number) => {
    const chavrutas = await fetchPendingChavrutasFromCMS();
    console.log('Pending Matches:', chavrutas); // Debug log
    const pendingMatches = chavrutas .map(chavruta => ({
        id: chavruta._id,
        israeliParticipant: chavruta.fromIsraelId?.fullName || 'Unknown',
        diasporaParticipant: chavruta.fromWorldId?.fullName || 'Unknown',
        track: chavruta.track || 'Unknown'
      }));

    const filteredMatches = pendingMatches.filter(match =>
      match.israeliParticipant.toLowerCase().includes(search.toLowerCase()) ||
      match.diasporaParticipant.toLowerCase().includes(search.toLowerCase()) ||
      match.track.toLowerCase().includes(search.toLowerCase())
    );

    return {
      data: filteredMatches.slice((page - 1) * pageSize, page * pageSize),
      total: filteredMatches.length
    };
  };

  const handleActivate = async (id: string) => {
    try {
      await updateChavrutaBase(id, (chavruta) => ({
        ...chavruta,
        status: PairStatus.Active // Using enum instead of magic number
      }));
      // Optionally refresh the table data
    } catch (error) {
      console.error('Error activating match:', error);
    }
  };

  const handleDiscard = async (id: string) => {
    try {
      await updateChavrutaBase(id, (chavruta) => ({
        ...chavruta,
        status: PairStatus.Standby // Using enum instead of magic number
      }));
      // Optionally refresh the table data
    } catch (error) {
      console.error('Error discarding match:', error);
    }
  };

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
              fetchData={fetchPendingMatches}
            />
          </Box>
        </Page.Content>
      </Page>
    </WixDesignSystemProvider>
  );
};

export default DashboardPage;
