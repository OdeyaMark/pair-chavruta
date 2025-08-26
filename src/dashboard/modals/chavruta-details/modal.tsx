import React, { type FC, useEffect, useState } from 'react';
import { dashboard } from '@wix/dashboard';
import {
  WixDesignSystemProvider,
  Text,
  Box,
  CustomModalLayout,
} from '@wix/design-system';
import '@wix/design-system/styles.global.css';
import { width, height, title } from './modal.json';
import ChavrutaDetails from '../../../components/ChavrutaDetails';
import { updateChavrutaBase } from '../../../data/cmsData';

// To open your modal, call `openModal` with your modal id.
// e.g.
// import { dashboard } from '@wix/dashboard';
// function MyComponent() {
//   return <button onClick={() => dashboard.openModal('c83c7139-5b30-4e82-be8f-6870568f6ee0')}>Open Modal</button>;
// }
const Modal: FC = () => {
  const [modalParams, setModalParams] = useState<ModalParams | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const observerResult = dashboard.observeState((params: ModalParams) => {
      setModalParams(params);
      setIsLoading(false);
    });

    return () => observerResult?.disconnect?.();
  }, []);

  const handleNoteChange = async (note: string) => {
    if (!modalParams?.chavrutaId) return;

    try {
      // Call your updateChavruta function here
      await updateChavrutaBase(modalParams.chavrutaId, (chavruta) => ({
        ...chavruta,
        note: note,
        // ... other required fields
      }));
    } catch (error) {
      console.error('Error updating note:', error);
      throw error;
    }
  };

  return (
    <WixDesignSystemProvider features={{ newColorsBranding: true }}>
      <CustomModalLayout
        width={width}
        maxHeight={height}
        primaryButtonText="Close"
        onCloseButtonClick={() => dashboard.closeModal()}
        primaryButtonOnClick={() => dashboard.closeModal()}
        title={isLoading ? "Loading..." : "Chavruta Details"}
        subtitle={isLoading ? "" : `${modalParams?.israeliParticipant?.fullName || ''} & ${modalParams.diasporaParticipant?.fullName || ''}`}
        content={
          isLoading ? (
            <Box align="center" verticalAlign="middle" padding="20px">
              <Text>Loading chavruta details...</Text>
            </Box>
          ) : (
            <ChavrutaDetails 
              israeliParticipant={modalParams?.israeliParticipant}
              diasporaParticipant={modalParams?.diasporaParticipant}
              initialNote={modalParams?.initialNote}
              onNoteChange={handleNoteChange}
            />
          )
        }
      />
    </WixDesignSystemProvider>
  );
};

interface ModalParams {
  israeliParticipant: Participant;
  diasporaParticipant: Participant;
  chavrutaId: string;
  initialNote: string;
}

export default Modal;
