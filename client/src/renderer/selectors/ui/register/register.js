// @flow
import { List } from 'immutable';
import type { State } from '../../../reducers/index';

export const getUsername = (state: State) => state.ui.register.username;
export const getPassword = (state: State) => state.ui.register.password;
export const getConfirmPassword = (state: State) => state.ui.register.confirmPassword;
export const getCustomSecret = (state: State) => state.ui.register.customSecret;
export const hasCustomSecret = (state: State) => state.ui.register.customSecret.length !== 0;
export const getErrors = (state: State): List<string> => state.ui.register.errors;
export const isSubmitting = (state: State) => state.ui.register.isSubmitting;
