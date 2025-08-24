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
import ChavrutaDetails from '../../../components/ChavrutaDetails';

// To open your modal, call `openModal` with your modal id.
// e.g.
// import { dashboard } from '@wix/dashboard';
// function MyComponent() {
//   return <button onClick={() => dashboard.openModal('c83c7139-5b30-4e82-be8f-6870568f6ee0')}>Open Modal</button>;
// }
const Modal: FC = () => {
  return (
    <WixDesignSystemProvider features={{ newColorsBranding: true }}>
      <CustomModalLayout
        width={width}
        maxHeight={height}
        primaryButtonText={"close"}
        secondaryButtonText={undefined}
        onCloseButtonClick={() => dashboard.closeModal()}
        primaryButtonOnClick={() => dashboard.closeModal()}
        secondaryButtonOnClick={undefined}
        title={title}
        subtitle="Edit this file to customize your modal"
        content={
          <ChavrutaDetails />
        }
      />
    </WixDesignSystemProvider>
  );
};

export default Modal;
