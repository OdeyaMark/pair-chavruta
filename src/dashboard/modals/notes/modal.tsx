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
import { createLogger } from '../../../utils/logger';
import { useDashboardModalParams } from '../../../hooks/useDashboardModalParams';

const logger = createLogger('notes-modal');

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
  const params = useDashboardModalParams<ModalParams>();

  useEffect(() => {
    if (!params) {
      return;
    }

    setModalState({
      userId: params.userId || null,
      initialNote: params.initialNote || '',
      onSave: params.onSave,
    });
  }, [params]);

  const handleSave = async (note: string) => {
    try {
      if (modalState.onSave) {
        await modalState.onSave(note);
        dashboard.closeModal();
      }
    } catch (error) {
      logger.error('Error saving note:', error);
    }
  };

  return (
    <WixDesignSystemProvider features={{ newColorsBranding: true }}>
      <CustomModalLayout
        width={width}
        maxHeight={height}
        onCloseButtonClick={() => dashboard.closeModal()}
        title={`Notes for User`}
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
