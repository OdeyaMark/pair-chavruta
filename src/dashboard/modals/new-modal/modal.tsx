import React, { type FC } from 'react';
import { dashboard } from '@wix/dashboard';
import {
  WixDesignSystemProvider,
  Text,
  Box,
  CustomModalLayout,
} from '@wix/design-system';
import '@wix/design-system/styles.global.css';
import { width, height, title } from './modal.json';

// To open your modal, call `openModal` with your modal id.
// e.g.
// import { dashboard } from '@wix/dashboard';
// function MyComponent() {
//   return <button onClick={() => dashboard.openModal('45308f7c-1309-42a3-8a0b-00611cab9ebe')}>Open Modal</button>;
// }
import { fetchUserById } from '../../../data/cmsData';
import UserCard from '../../../components/UserCard';

interface ModalParams {
  userId?: string;
  [key: string]: any;
}

const Modal: FC = () => {
  const [userId, setUserId] = React.useState<string | null>(null);
  const [userData, setUserData] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  // Effect for initializing userId from dashboard state
  React.useEffect(() => {
    let isSubscribed = true; // For avoiding state updates after unmount
    
    // Set up the observer
    const observerResult = dashboard.observeState((componentParams: ModalParams) => {
      if (!isSubscribed) return;
      
      if (componentParams && typeof componentParams === 'object' && componentParams.userId) {
        setUserId(componentParams.userId);
      }
    });

    // Cleanup function
    return () => {
      isSubscribed = false;
      if (observerResult && observerResult.disconnect) {
        observerResult.disconnect();
      }
    };
  }, []);

  // Separate effect for fetching user data when userId changes
  React.useEffect(() => {
    let isSubscribed = true;

    const fetchUser = async () => {
      if (!userId) return;

      try {
        setIsLoading(true);
        const data = await fetchUserById(userId);
        
        if (!isSubscribed) return;
        setUserData(data || null);
      } catch (error) {
        console.error("Error fetching user data:", error);
        if (isSubscribed) {
          setUserData(null);
        }
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

  return (
    <WixDesignSystemProvider features={{ newColorsBranding: true }}>
      <CustomModalLayout
        width={width}
        maxHeight={height}
        primaryButtonText="Save"
        secondaryButtonText="Cancel"
        onCloseButtonClick={() => dashboard.closeModal()}
        primaryButtonOnClick={() => dashboard.closeModal()}
        secondaryButtonOnClick={() => dashboard.closeModal()}
        title={title}
        subtitle={isLoading ? "Loading user data..." : "User Details"}
        content={
          isLoading ? (
            <Box align="center" verticalAlign="middle" padding="20px">
              <Text>Loading user data...</Text>
            </Box>
          ) : userData ? (
            <UserCard user={userData} />
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
