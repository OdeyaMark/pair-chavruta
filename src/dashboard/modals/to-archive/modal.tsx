import React, { type FC, useState } from 'react';
import { dashboard } from '@wix/dashboard';
import {
  WixDesignSystemProvider,
  Text,
  Box,
  CustomModalLayout,
} from '@wix/design-system';
import '@wix/design-system/styles.global.css';
import { width, height, title } from './modal.json';
import { createLogger } from '../../../utils/logger';
import { archiveUser, getUserById } from '../../../data/cmsData';
import { useDashboardModalParams } from '../../../hooks/useDashboardModalParams';

const logger = createLogger('to-archive-modal');


interface ModalParams {
  userId?: string;
}

const Modal: FC = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const params = useDashboardModalParams<ModalParams>();

  // Effect for initializing userId from dashboard state
  React.useEffect(() => {
    if (params?.userId) {
      setUserId(params.userId);
      return;
    }

    setIsLoading(false);
  }, [params]);

  // Effect for fetching user data
  React.useEffect(() => {
    let isSubscribed = true;

    const fetchUser = async () => {
      if (!userId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const user = await getUserById(userId);
        if (!isSubscribed) return;

        setUserName(user?.fullName || 'this user');
      } catch (error) {
        logger.error('Error fetching user for archive modal:', error);
        if (!isSubscribed) return;
        setUserName('this user');
      } finally {
        if (isSubscribed) {
          setIsLoading(false);
        }
      }
    };

    fetchUser();

    return () => {
      isSubscribed = false;
    };
  }, [userId]);

  const handleArchive = async () => {
    if (userId) {
      try {
        logger.debug('Archiving user:', userId);
        await archiveUser(userId);
        dashboard.showToast({
          message: 'User archived successfully.',
          type: 'success'
        });
        dashboard.closeModal();
      } catch (error) {
        logger.error('Error archiving user:', error);
        dashboard.showToast({
          message: 'Error archiving user. Please try again.',
          type: 'error'
        });
      }
    }
  };

  return (
    <WixDesignSystemProvider features={{ newColorsBranding: true }}>
      <CustomModalLayout
        width={width}
        maxHeight={height}
        primaryButtonText="Archive"
        onCloseButtonClick={() => dashboard.closeModal()}
        primaryButtonOnClick={handleArchive}
        title="Archive User"
        subtitle={ 'Confirm Archive'}
        content={
          isLoading ? (
            <Box align="center" verticalAlign="middle" padding="20px">
              <Text>Loading user data...</Text>
            </Box>
          ) : userId? (
            <Box direction="vertical" align="center">
              <Text>
                Are you sure you want to move {userName} to archive?
              </Text>
            </Box>
          ) : (
            <Box align="center" verticalAlign="middle" padding="20px">
              <Text>No user data available</Text>
            </Box>
          )
        }
      />
    </WixDesignSystemProvider>
  );
};

export default Modal;
