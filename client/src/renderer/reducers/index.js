// @flow
import type { Reducer } from 'redux';
import { combineReducers } from 'redux';
import { reducer as storageReducer } from 'redux-storage';
import merger from 'redux-storage-merger-immutablejs';
import UiState from '../types/ui/ui';
import UserState from '../types/user';
import ui from './ui/ui';
import user from './user';

/**
 * Export the type
 */
export type State = {
  +ui: UiState,
  +user: UserState,
};

/**
 * Combines the reducers. Don't forget the redux storage reducer and the immutable js merger.
 */
const rootReducer: Reducer<State> = storageReducer(combineReducers({
  ui,
  user,
}), merger);

export default rootReducer;
