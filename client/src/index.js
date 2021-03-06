// @flow
import React from 'react';
import { render } from 'react-dom';
import { createLoader as createStorageLoader, createMiddleware as createStorageMiddleware } from 'redux-storage';
// Import css
import 'semantic-ui-css/semantic.min.css';
import { authenticate, deauthenticate } from './renderer/actions/user';
import App from './renderer/App';
import configureStorageEngine from './renderer/lib/configureStorageEngine';
import configureStore from './renderer/lib/configureStore';
import './renderer/style/base.css';

const initialize = async () => {
  // Configure the persistent storage engine
  const storageEngine = configureStorageEngine();

  // Create the persistent storage middleware
  const storageMiddleware = createStorageMiddleware(storageEngine);

  // Create the store
  const store = configureStore({}, storageMiddleware);

  // Create the persistent storage loader
  const load = createStorageLoader(storageEngine);

  // Load data from persistent storage into the store
  const storage = await load(store);
  if (storage.user && storage.user.privateKey && storage.user.token) {
    await store.dispatch(authenticate(storage.user.token, storage.user.privateKey, true));
  } else {
    await store.dispatch(deauthenticate());
  }

  // Render the application
  const root = document.getElementById('root');
  if (root !== null) {
    render(<App store={store}/>, root);
  }
};

initialize();