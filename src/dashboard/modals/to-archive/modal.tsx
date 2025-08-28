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


interface ModalParams {
  userId?: string;
}

const Modal: FC = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Effect for initializing userId from dashboard state
  React.useEffect(() => {
    const observerResult = dashboard.observeState((params: ModalParams) => {
      if (params?.userId) {
        setUserId(params.userId);
      }
    });

    return () => observerResult?.disconnect?.();
  }, []);

  // Effect for fetching user data
  React.useEffect(() => {
    let isSubscribed = true;
    if (userId)
      return () => {
        isSubscribed = false;
      };
     
  }, [userId]);

  const handleArchive = async () => {
    if (userId) {
      try {
        // TODO: Implement archive functionality
        console.log('Archiving user:', userId);
        dashboard.closeModal();
      } catch (error) {
        console.error('Error archiving user:', error);
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
                Are you sure you want to move the user to archive?
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
