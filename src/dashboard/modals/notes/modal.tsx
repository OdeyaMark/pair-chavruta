import React, { type FC, useState, useEffect } from 'react';
import { dashboard } from '@wix/dashboard';
import {
  WixDesignSystemProvider,
  Box,
  CustomModalLayout,
} from '@wix/design-system';
import '@wix/design-system/styles.global.css';
import { width, height } from './modal.json';
import NotesSection from '../../../components/NotesSection';

interface ModalParams {
  userId: string;
  initialNote?: string;
  onSave: (note: string) => Promise<void>;
}

interface ModalState {
  userId: string | null;
  initialNote: string;
  onSave?: (note: string) => Promise<void>;
}

const initialModalState: ModalState = {
  userId: null,
  initialNote: '',
};

const Modal: FC = () => {
  const [modalState, setModalState] = useState<ModalState>(initialModalState);

  useEffect(() => {
    const observerResult = dashboard.observeState((params: ModalParams) => {
      if (params) {
        setModalState({
          userId: params.userId || null,
          initialNote: params.initialNote || '',
          onSave: params.onSave,
        });
      }
    });

    return () => observerResult?.disconnect?.();
  }, []);

  const handleSave = async (note: string) => {
    try {
      if (modalState.onSave) {
        await modalState.onSave(note);
        dashboard.closeModal();
      }
    } catch (error) {
      console.error('Error saving note:', error);
    }
  };

  return (
    <WixDesignSystemProvider features={{ newColorsBranding: true }}>
      <CustomModalLayout
        width={width}
        maxHeight={height}
        onCloseButtonClick={() => dashboard.closeModal()}
        title={`Notes for User ${modalState.userId}`}
        content={
          <Box direction="vertical" padding="24px">
            <NotesSection
              initialNote={modalState.initialNote}
              onSave={handleSave}
            />
          </Box>
        }
      />
    </WixDesignSystemProvider>
  );
};

export default Modal;
