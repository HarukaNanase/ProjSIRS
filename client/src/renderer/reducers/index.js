// @flow
import type { Reducer, Action } from 'redux';
import { combineReducers } from 'redux';
import { reducer as storageReducer } from 'redux-storage';
import merger from 'redux-storage-merger-immutablejs';
import RemoteFileState from '../types/remoteFile';
import RemotePathState from '../types/remotePath';
import UiState from '../types/ui/ui';
import UserState from '../types/user';
import remoteFile from './remoteFile';
import remotePath from './remotePath';
import ui from './ui/ui';
import user from './user';
import { UserActionTypes } from '../actions/user';

/**
 * Export the type
 */
export type State = {
  +ui: UiState,
  +user: UserState,
  +remoteFile: RemoteFileState,
  +remotePath: RemotePathState,
};

/**
 * The reducer that will listen to LOGOUT action in case it happens.
 * Otherwise delegates to the app reducer.
 */
const rootReducer: Reducer<State> = (state?: State, action: Action) => {
  if (action.type === UserActionTypes.LOGOUT) {
    state = undefined;
  }
  return appReducer(state, action);
};

/**
 * Combines the reducers. Don't forget the redux storage reducer and the immutable js merger.
 */
const appReducer: Reducer<State> = storageReducer(combineReducers({
  ui,
  user,
  remoteFile,
  remotePath,
}), merger);

export default rootReducer;
