// @flow
import hoistStatics from 'hoist-non-react-statics';
import React from 'react';
import electron, { ipcRenderer } from '../lib/electron';

const withElectron = (WrappedComponent: any) => {
  const C = (props: any) => {
    const {wrappedComponentRef, ...remainingProps} = props;
    let injectedProps = {electron: null};
    if (window.require) {
      injectedProps = {
        electron,
        ipcRenderer
      };
    }
    return <WrappedComponent {...remainingProps} ref={wrappedComponentRef} {...injectedProps} />;
  };
  C.displayName = `withElectron(${WrappedComponent.displayName || WrappedComponent.name})`;
  C.WrappedComponent = WrappedComponent;
  return hoistStatics(C, WrappedComponent);
};

export default withElectron;