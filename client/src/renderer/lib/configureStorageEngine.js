// @flow
import filter from 'redux-storage-decorator-filter';
import engine from 'redux-storage-engine-localstorage';

/**
 * Configures the persistent storage engine.
 *
 * @returns {*} Storage engine.
 */
const configureStorageEngine = (): any =>
  filter(
    engine('client'),
    [
      ['user', 'token'],
      ['user', 'secret'],
    ],
  );

export default configureStorageEngine;