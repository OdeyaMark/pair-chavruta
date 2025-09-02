import React, { type FC, useState, useEffect } from 'react';
import { dashboard } from '@wix/dashboard';
import {
  WixDesignSystemProvider,
  Text,
  Box,
  CustomModalLayout,
} from '@wix/design-system';
import '@wix/design-system/styles.global.css';
import { width, height } from './modal.json';
import NotesSection from '../../../components/NotesSection';



interface ModalParams {
  pairId: string;
  onDelete: (pairId: string, reason: string) => Promise<void>;
}

interface ModalState {
  pairId: string | null;
  onDelete?: (pairId: string, reason: string) => Promise<void>;
}

const initialModalState: ModalState = {
  pairId: null,
};

const Modal: FC = () => {
  const [modalState, setModalState] = useState<ModalState>(initialModalState);
  const [deleteReason, setDeleteReason] = useState<string>('');

  useEffect(() => {
    console.log("opening delete modal");
    const observerResult = dashboard.observeState((params: ModalParams) => {
      if (params) {
        setModalState({
          pairId: params.pairId || null,
          onDelete: params.onDelete,
        });
      }
    });

    return () => observerResult?.disconnect?.();
  }, []);

  const handleDelete = async () => {
    try {
      if (modalState.pairId && modalState.onDelete) {
        await modalState.onDelete(modalState.pairId, deleteReason);
        dashboard.closeModal();
      }
    } catch (error) {
      console.error('Error deleting pair:', error);
    }
  };

  return (
    <WixDesignSystemProvider features={{ newColorsBranding: true }}>
      <CustomModalLayout
        width={width}
        maxHeight={height}
        primaryButtonText="Delete"
        secondaryButtonText="Cancel"
        onCloseButtonClick={() => dashboard.closeModal()}
        primaryButtonOnClick={handleDelete}
        secondaryButtonOnClick={() => dashboard.closeModal()}
        title="Delete Chavruta Pair"
        subtitle="Are you sure you want to delete this chavruta pair?"
        content={
          <Box direction="vertical" padding="24px">
            <Text weight="bold" marginBottom="24px">
              Please provide a reason for deleting this pair
            </Text>
            <NotesSection
              initialNote={deleteReason}
              onSave={async (note: string) => {
                setDeleteReason(note);
              }}
              showSaveButton={false}
            />
          </Box>
        }
      />
    </WixDesignSystemProvider>
  );
};

export default Modal;
