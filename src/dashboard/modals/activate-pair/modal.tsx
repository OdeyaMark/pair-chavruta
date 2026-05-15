import React, { type FC, useState, useEffect } from 'react';
import { dashboard } from '@wix/dashboard';
import {
  WixDesignSystemProvider,
  Text,
  Box,
  CustomModalLayout,
} from '@wix/design-system';
import '@wix/design-system/styles.global.css';
import { width, height, title } from './modal.json';
import { activatePairInDatabase, sendPairingEmail } from '../../../data/cmsData';
import { createLogger } from '../../../utils/logger';

const logger = createLogger('activate-pair-modal');

interface ModalParams {
  chavrutaId: string;
  sourceUserId: string;
  sourceUserName: string;
  targetUserId: string;
  targetUserName: string;
  trackId: string;
  trackName?: string;
  onActivated?: () => Promise<void> | void;
}

const Modal: FC = () => {
  const [step, setStep] = useState<'confirm' | 'email'>('confirm');
  const [params, setParams] = useState<ModalParams | null>(null);

  useEffect(() => {
    
    // Get the modal parameters when the modal opens
    const observerResult = dashboard.observeState((receivedParams: any) => {
      logger.debug("dashboard.observeState callback called with:", receivedParams);
      if (receivedParams) {
        setParams(receivedParams);
      } else {
        logger.debug("No params received in observeState");
      }
    });
    
    return () => {
      logger.debug('Modal cleanup called');
      observerResult?.disconnect?.();
    };
  }, []);

  const handleConfirm = () => {
    // Move to the email confirmation step
    setStep('email');
  };

  const handleSendEmail = async () => {
    
    if (!params) {
      logger.debug('No params available, returning early');
      return;
    }

    try {
      await activatePairInDatabase(params.chavrutaId, true);
      await sendPairingEmail(params.sourceUserId, params.targetUserId, params.trackId);
      
      dashboard.showToast({
        message: `Pair activated between ${params.sourceUserName} and ${params.targetUserName}. Email sent!`,
        type: 'success'
      });

      await params.onActivated?.();
      
      dashboard.closeModal();
    } catch (error) {
      logger.error('Error activating pair or sending email:', error);
      dashboard.showToast({
        message: 'Error activating pair or sending email',
        type: 'error'
      });
    }
  };

  const handleSkipEmail = async () => {
    
    
    if (!params) {
      logger.debug('No params available, returning early');
      return;
    }

    try {
      await activatePairInDatabase(params.chavrutaId, false);
      
      dashboard.showToast({
        message: `Pair activated between ${params.sourceUserName} and ${params.targetUserName}`,
        type: 'success'
      });

      await params.onActivated?.();
      
      dashboard.closeModal();
    } catch (error) {
      logger.error('Error activating pair:', error);
      dashboard.showToast({
        message: 'Error activating pair',
        type: 'error'
      });
    }
  };

  const handleCancel = () => {
    dashboard.closeModal();
  };

  logger.debug('Modal render - step:', step, 'params:', params);

  if (step === 'confirm') {
    return (
      <WixDesignSystemProvider features={{ newColorsBranding: true }}>
        <CustomModalLayout
          width={width}
          maxHeight={height}
          primaryButtonText="Confirm"
          secondaryButtonText="Cancel"
          onCloseButtonClick={handleCancel}
          primaryButtonOnClick={handleConfirm}
          secondaryButtonOnClick={handleCancel}
          title={title}
          subtitle="Are you sure you want to activate the pair?"
          content={
            <Box direction="vertical" align="center" gap="16px">
              {params ? (
                <>
                  <Box direction="vertical" align="center" gap="8px">
                    <Text size="medium" weight="bold" color="#2196f3">
                      {params.sourceUserName}
                    </Text>
                    <Text size="medium">paired with</Text>
                    <Text size="medium" weight="bold" color="#2196f3">
                      {params.targetUserName}
                    </Text>
                    {params.trackName && (
                      <>
                        <Text size="medium">for track:</Text>
                        <Text size="medium" weight="bold" color="#4caf50">
                          {params.trackName}
                        </Text>
                      </>
                    )}
                  </Box>
                  
                  <Text size="small" color="#666">
                    This action will create a learning partnership between these two users.
                  </Text>
                </>
              ) : (
                <Text>Loading parameters...</Text>
              )}
            </Box>
          }
        />
      </WixDesignSystemProvider>
    );
  }

  // step === 'email'
  return (
    <WixDesignSystemProvider features={{ newColorsBranding: true }}>
      <CustomModalLayout
        width={width}
        maxHeight={height}
        primaryButtonText="Yes, Send Email"
        secondaryButtonText="Skip Email"
        onCloseButtonClick={handleCancel}
        primaryButtonOnClick={handleSendEmail}
        secondaryButtonOnClick={handleSkipEmail}
        title={title}
        subtitle="Would you like to send an email to the pair?"
        content={
          <Box direction="vertical" align="center" gap="16px">
            {params ? (
              <>
                <Text size="medium">
                  An email will be sent to both:
                </Text>
                <Box direction="vertical" align="center" gap="4px">
                  <Text size="medium" weight="bold" color="#2196f3">
                    • {params.sourceUserName}
                  </Text>
                  <Text size="medium" weight="bold" color="#2196f3">
                    • {params.targetUserName}
                  </Text>
                </Box>
                
                <Text size="small" color="#666">
                  The email will contain their contact information and learning preferences.
                </Text>
              </>
            ) : (
              <Text>Loading parameters...</Text>
            )}
          </Box>
        }
      />
    </WixDesignSystemProvider>
  );
};

export default Modal;
