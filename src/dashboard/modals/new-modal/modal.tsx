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
import { fetchUserById, saveUserChanges } from '../../../data/cmsData';
import UserCard from '../../../components/UserCard';
import EditUserForm from '../../../components/EditUserForm';
import { reverseFormatUserData } from '../../../data/formatters';
import ContactPopup from '../../../components/contactPopup';

interface ModalParams {
  userId?: string;
  editMode?: boolean;
  contactMode?: boolean;  // Add this
}

interface ModalState {
  userId: string | null;
  editMode: boolean;
  contactMode: boolean;
}

const initialModalState: ModalState = {
  userId: null,
  editMode: false,
  contactMode: false,
};

const Modal: FC = () => {
  // Combine related state into a single object to prevent race conditions
  const [modalState, setModalState] = useState<ModalState>(initialModalState);
  const [userData, setUserData] = useState<Record<string, any> | null>(null);
  const [editedData, setEditedData] = useState<Record<string, any> | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  // Effect for initializing userId and editMode from dashboard state
  React.useEffect(() => {
    const observerResult = dashboard.observeState((params: ModalParams) => {
      if (params) {
        setModalState({
          userId: params.userId || null,
          editMode: Boolean(params.editMode),
          contactMode: Boolean(params.contactMode)
        });
      }
    });

    return () => observerResult?.disconnect?.();
  }, []);

  // Update the data fetching effect to use modalState
  React.useEffect(() => {
    let isSubscribed = true;

    const fetchUser = async () => {
      if (!modalState.userId) return;

      try {
        setIsLoading(true);
        const data = await fetchUserById(modalState.userId);
        
        if (isSubscribed) {
          setUserData(data || null);
        }
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
    console.log("contact mode", modalState.contactMode);
    return () => { isSubscribed = false; };
  }, [modalState.userId]);

  // Update save handler to use modalState
  const handleSave = async () => {
    if (modalState.editMode && editedData && modalState.userId) {
      try {
        await saveUserChanges(editedData, modalState.userId);
        dashboard.closeModal();
      } catch (error) {
        console.error('Error saving user data:', error);
      }
    } else {
      dashboard.closeModal();
    }
  };

  React.useEffect(() => {
    if (modalState.contactMode && userData) {
      console.log('Contact mode active with user data:', {
        email: userData.email,
        tel: userData.tel,
        contactMode: modalState.contactMode
      });
    }
  }, [modalState.contactMode, userData]);

  return (
    <WixDesignSystemProvider features={{ newColorsBranding: true }}>
      <CustomModalLayout
        width={modalState.contactMode ? "400px" : width}
        maxHeight={modalState.contactMode ? "300px" : height} // Increased from 200px to 300px
        height={modalState.contactMode ? "400px" : undefined} // Add minHeight for contact mode
        primaryButtonText={modalState.editMode ? "Save" : "Close"}
        secondaryButtonText={modalState.editMode ? "Cancel" : undefined}
        secondaryButtonOnClick={modalState.editMode ? () => dashboard.closeModal() : undefined}
        onCloseButtonClick={() => dashboard.closeModal()}
        primaryButtonOnClick={handleSave}
        title={modalState.contactMode ? "Contact Details" : (userData?.fullName || title)}
        subtitle={isLoading ? "Loading user data..." : 
          modalState.contactMode ? userData?.fullName :
          modalState.editMode ? "Edit User" : "User Details"
        }
        content={
          isLoading ? (
            <Box align="center" verticalAlign="middle" padding="20px">
              <Text>Loading user data...</Text>
            </Box>
          ) : userData ? (
            modalState.contactMode ? (
              <Box 
                padding="5px"
                height="100%" // Add full height to Box
                verticalAlign="middle" // Center content vertically
              >
                <ContactPopup 
                  email={userData.email} 
                  phone={userData.tel}
                />
              </Box>
            ) : modalState.editMode ? (
              <EditUserForm 
                user={userData}
                onChange={setEditedData}
              />
            ) : (
              <UserCard user={userData} />
            )
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
