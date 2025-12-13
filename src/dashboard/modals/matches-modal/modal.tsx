import React, { type FC, useEffect, useState } from 'react';
import { dashboard } from '@wix/dashboard';
import {
  WixDesignSystemProvider,
  CustomModalLayout,
} from '@wix/design-system';
import '@wix/design-system/styles.global.css';
import { width, height, title } from './modal.json';
import MatchPopup from '../../../components/matchPopup';
import { getUserById } from '../../../data/cmsData';

interface User {
  _id: string;
  fullName: string;
  country: string;
  gender: string;
  prefGender?: string;
  englishLevel?: number;
  desiredEnglishLevel?: number;
  skillLevel?: number;
  desiredSkillLevel?: number;
  learningStyle?: number;
  prefTracks?: number[];
  utcOffset: string | number;
  openQuestions?: {
    question: string;
    answer: string;
  }[];
  // Time availability (can be boolean object or array)
  sunday?: any;
  monday?: any;
  tuesday?: any;
  wednesday?: any;
  thursday?: any;
}

interface MatchModalParams {
  selectedUserId?: string;
  matchUserId?: string;
}

const Modal: FC = () => {
  const [user1, setUser1] = useState<User | null>(null);
  const [user2, setUser2] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const observerResult = dashboard.observeState((params: MatchModalParams) => {
      if (params?.selectedUserId && params?.matchUserId) {
        console.log('Received match modal params:', params);
        fetchUsers(params.selectedUserId, params.matchUserId);
      }
    });
    return () => observerResult?.disconnect?.();
  }, []);

  const fetchUsers = async (userId1: string, userId2: string) => {
    setLoading(true);
    setError(null);
    try {
      const [fetchedUser1, fetchedUser2] = await Promise.all([
        getUserById(userId1),
        getUserById(userId2)
      ]);

      if (!fetchedUser1 || !fetchedUser2) {
        setError('Failed to load user data');
        return;
      }

      setUser1(fetchedUser1);
      setUser2(fetchedUser2);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  // Determine which user is Israeli and which is from diaspora
  const getUsersByLocation = () => {
    if (!user1 || !user2) return null;

    // Check if user1 is Israeli
    const user1IsIsraeli = user1.country?.toLowerCase() === 'israel';
    const user2IsIsraeli = user2.country?.toLowerCase() === 'israel';

    // If both or neither are Israeli, use the first as Israeli for display purposes
    if (user1IsIsraeli === user2IsIsraeli) {
      return {
        israelUser: user1,
        diasporaUser: user2
      };
    }

    // Return with proper roles
    return {
      israelUser: user1IsIsraeli ? user1 : user2,
      diasporaUser: user1IsIsraeli ? user2 : user1
    };
  };

  const handleClose = () => {
    // Clear the state when closing
    setUser1(null);
    setUser2(null);
    setLoading(true);
    setError(null);
    dashboard.closeModal();
  };

  const users = getUsersByLocation();

  if (loading) {
    return (
      <WixDesignSystemProvider features={{ newColorsBranding: true }}>
        <CustomModalLayout
          width={width}
          maxHeight={height}
          onCloseButtonClick={handleClose}
          title="Loading..."
          content={<div>Loading match data...</div>}
        />
      </WixDesignSystemProvider>
    );
  }

  if (error || !user1 || !user2 || !users) {
    return (
      <WixDesignSystemProvider features={{ newColorsBranding: true }}>
        <CustomModalLayout
          width={width}
          maxHeight={height}
          onCloseButtonClick={handleClose}
          title="Error"
          content={<div>{error || 'Failed to load match data'}</div>}
        />
      </WixDesignSystemProvider>
    );
  }

  return (
    <WixDesignSystemProvider features={{ newColorsBranding: true }}>
      <CustomModalLayout
        onCloseButtonClick={handleClose}
        title={`Match Analysis: ${users.israelUser.fullName} & ${users.diasporaUser.fullName}`}
        content={
          <MatchPopup
            israelUser={users.israelUser}
            diasporaUser={users.diasporaUser}
            onClose={handleClose}
          />
        }
      />
    </WixDesignSystemProvider>
  );
};

export default Modal;
