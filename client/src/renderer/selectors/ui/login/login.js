// @flow
import { List } from 'immutable';
import type { State } from '../../../reducers/index';

export const getUsername = (state: State) => state.ui.login.username;
export const getPassword = (state: State) => state.ui.login.password;
export const getCustomSecret = (state: State) => state.ui.login.customSecret;
export const hasCustomSecret = (state: State) => state.ui.login.customSecret.length !== 0;
export const getErrors = (state: State): List<string> => state.ui.login.errors;
export const isSubmitting = (state: State) => state.ui.login.isSubmitting;
