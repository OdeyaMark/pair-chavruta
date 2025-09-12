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
import { reverseFormatUserData, prepareDataForSaving } from '../../../data/formatters';
import ContactPopup from '../../../components/contactPopup';

interface ModalParams {
  userId?: string;
  editMode?: boolean;
  contactMode?: boolean;
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
  const [modalState, setModalState] = useState<ModalState>(initialModalState);
  const [userData, setUserData] = useState<Record<string, any> | null>(null);
  const [editedData, setEditedData] = useState<Record<string, any> | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

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
    return () => { isSubscribed = false; };
  }, [modalState.userId]);

  const handleSave = async () => {
    if (modalState.editMode && editedData && modalState.userId) {
      try {
        // Use the new formatter function to prepare data for saving
        const dataToSave = prepareDataForSaving(editedData);
        
        await saveUserChanges(dataToSave, modalState.userId);
        dashboard.closeModal();
      } catch (error) {
        console.error('Error saving user data:', error);
      }
    } else {
      dashboard.closeModal();
    }
  };

  const handleEditDataChange = (newData: Record<string, any> | null) => {
    setEditedData(newData);
  };

  return (
    <WixDesignSystemProvider features={{ newColorsBranding: true }}>
      <CustomModalLayout
        width={modalState.contactMode ? "400px" : width}
        maxHeight={modalState.contactMode ? "300px" : height}
        height={modalState.contactMode ? "400px" : undefined}
        primaryButtonText={
          modalState.contactMode ? "Close" : 
          modalState.editMode ? "Save" : "Close"
        }
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
                height="100%"
                verticalAlign="middle"
              >
                <ContactPopup 
                  email={userData.email} 
                  phone={userData.tel}
                />
              </Box>
            ) : modalState.editMode ? (
              <EditUserForm 
                user={userData}
                onChange={handleEditDataChange}
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
