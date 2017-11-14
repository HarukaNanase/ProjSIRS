// @flow
import { List } from 'immutable';
import { MINIMUM_SECRET_LENGTH } from '../../../../constants';
import server from '../../../lib/server';
import { ipcRenderer } from '../../../lib/electron';
import type { State } from '../../../reducers/index';
import {
  getConfirmPassword,
  getCustomSecret,
  getPassword,
  getUsername,
  hasCustomSecret
} from '../../../selectors/ui/register/register';
import type { Dispatch, PromiseAction, ThunkAction } from '../../index';

export const RegisterActionTypes = {
  SET_USERNAME: 'UI/REGISTER/SET_USERNAME',
  SET_PASSWORD: 'UI/REGISTER/SET_PASSWORD',
  SET_CONFIRM_PASSWORD: 'UI/REGISTER/SET_CONFIRM_PASSWORD',
  SET_CUSTOM_SECRET: 'UI/REGISTER/SET_CUSTOM_SECRET',
  SET_ERRORS: 'UI/REGISTER/SET_ERRORS',
  CLEAR_ERRORS: 'UI/REGISTER/CLEAR_ERRORS',
  RESET_FORM: 'UI/REGISTER/RESET_FORM',
  SET_IS_SUBMITTING: 'UI/REGISTER/SET_IS_SUBMITTING'
};

export const setUsername = (username: string) => ({
  type: RegisterActionTypes.SET_USERNAME, payload: username
});

export const setPassword = (password: string) => ({
  type: RegisterActionTypes.SET_PASSWORD, payload: password
});

export const setConfirmPassword = (password: string) => ({
  type: RegisterActionTypes.SET_CONFIRM_PASSWORD, payload: password
});

export const setCustomSecret = (customSecret: string) => ({
  type: RegisterActionTypes.SET_CUSTOM_SECRET, payload: customSecret
});

export const setErrors = (errors: List<string>) => ({
  type: RegisterActionTypes.SET_ERRORS, payload: errors
});

export const clearErrors = () => ({
  type: RegisterActionTypes.CLEAR_ERRORS
});

export const reset = () => ({
  type: RegisterActionTypes.RESET_FORM
});

export const setIsSubmitting = (value: boolean) => ({
  type: RegisterActionTypes.SET_IS_SUBMITTING, payload: value
});

const validate = (state: State, dispatch: Dispatch): boolean => {
  const username = getUsername(state);
  const password = getPassword(state);
  const confirmPassword = getConfirmPassword(state);
  const customSecret = getCustomSecret(state);

  const errors = List().asMutable();
  if (username.length < 4) errors.push('Username must have 4 characters or more.');
  if (password.length === 0) errors.push('Password mustn\'t be empty.');
  if (password !== confirmPassword) errors.push('Password and confirm password must be equal.');
  if (hasCustomSecret(state) && customSecret.length < MINIMUM_SECRET_LENGTH)
    errors.push(`Custom secret must be bigger than ${MINIMUM_SECRET_LENGTH} characters.`);
  if (errors.size > 0) {
    dispatch(setErrors(errors.asImmutable()));
    return false;
  }
  return true;
};

/**
 * Logs in
 * @param history History instance to be able to route the user
 */
export const register = (history: any): ThunkAction =>
  async (dispatch: Dispatch, getState: () => State): PromiseAction => {
    dispatch(setIsSubmitting(true));
    dispatch(clearErrors());

    // Validate the form
    const state = getState();
    if (validate(state, dispatch)) {
      // Fetch the fields
      const username = getUsername(state);
      const password = getPassword(state);
      const secret = hasCustomSecret(state) ? getCustomSecret(state) : password;

      // Generate the hashed secret
      const hashedSecret = await ipcRenderer.sendAsync('hashSecret', secret);

      // Generate the hash password
      const hashedPassword = await ipcRenderer.sendAsync('hashPassword', password);

      // Generate key pair
      const { publicPem, privatePem } = await ipcRenderer.sendAsync('generateKeyPair', hashedSecret);

      console.log('Public key:\n', publicPem);
      console.log(`Encrypted private key with ${hashedSecret}:\n`, privatePem);
      console.log('Hashed password: ', hashedPassword);

      try {
        const response = await server.post('/register', {
          username,
          hashedPassword,
          privateKey: privatePem,
          publicKey: publicPem,
        });

        if (response.ok) {
          // Navigate to the wanted page
          const {from: {pathname}} = history.location.state || {from: {pathname: '/'}};
          history.replace(pathname);

          // Reset the login form
          await dispatch(reset());
        } else if (response.statusCode === 401) {
          dispatch(setErrors(List(['An user with that username already exists.'])));
        }
      } catch (e) {
        dispatch(setErrors(List(['Couldn\'t connect to server. Try again later.'])));
      }
    }

    dispatch(setIsSubmitting(false));
  };