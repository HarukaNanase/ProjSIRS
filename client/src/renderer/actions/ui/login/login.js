// @flow

import { List } from 'immutable';
import type { Dispatch, PromiseAction, ThunkAction } from '../../index';
import type { State } from '../../../reducers/index';
import server from '../../../lib/server';
import { ipcRenderer } from '../../../lib/electron';
import { authenticate, setPrivateKey, setPublicKey } from '../../user';
import { getCustomSecret, getPassword, getUsername, hasCustomSecret } from '../../../selectors/ui/login/login';

export const LoginActionTypes = {
  SET_USERNAME: 'UI/LOGIN/SET_USERNAME',
  SET_PASSWORD: 'UI/LOGIN/SET_PASSWORD',
  SET_CUSTOM_SECRET: 'UI/LOGIN/SET_CUSTOM_SECRET',
  PASSWORD_CLEAR: 'UI/LOGIN/PASSWORD_CLEAR',
  SET_ERRORS: 'UI/LOGIN/SET_ERRORS',
  CLEAR_ERRORS: 'UI/LOGIN/CLEAR_ERRORS',
  RESET_FORM: 'UI/LOGIN/RESET_FORM',
  SET_IS_SUBMITTING: 'UI/LOGIN/SET_IS_SUBMITTING'
};

export const setUsername = (username: string) => ({
  type: LoginActionTypes.SET_USERNAME, payload: username
});

export const setPassword = (password: string) => ({
  type: LoginActionTypes.SET_PASSWORD, payload: password
});

export const setCustomSecret = (customSecret: string) => ({
  type: LoginActionTypes.SET_CUSTOM_SECRET, payload: customSecret
});

export const clearPassword = () => ({
  type: LoginActionTypes.PASSWORD_CLEAR
});

export const setErrors = (errors: List<string>) => ({
  type: LoginActionTypes.SET_ERRORS, payload: errors
});

export const clearErrors = () => ({
  type: LoginActionTypes.CLEAR_ERRORS
});

export const reset = () => ({
  type: LoginActionTypes.RESET_FORM
});

export const setIsSubmitting = (value: boolean) => ({
  type: LoginActionTypes.SET_IS_SUBMITTING, payload: value
});

/**
 * Logs in
 * @param history History instance to be able to route the user
 */
export const login = (history: any): ThunkAction =>
  async (dispatch: Dispatch, getState: () => State): PromiseAction => {
    dispatch(setIsSubmitting(true));
    dispatch(clearErrors());
    try {
      const state = getState();
      const username = getUsername(state);
      const password = getPassword(state);
      const secret = hasCustomSecret(state) ? getCustomSecret(state) : password;

      // Generate the hashed secret
      const hashedSecret = await ipcRenderer.sendAsync('hashSecret', secret);

      // Generate the hashed password
      const hashedPassword = await ipcRenderer.sendAsync('hashPassword', password);

      const response = await server.post('/login', {
        username,
        hashedPassword
      });

      const responseJson = await response.json();
      if (response.ok) {
        // Authenticate
        await dispatch(authenticate(responseJson.token));

        // Get the key pair
        const {privateKey, publicKey} = await ipcRenderer.sendAsync('getKeyPair', response.privateKey, hashedSecret);
        await dispatch(setPrivateKey(privateKey));
        await dispatch(setPublicKey(publicKey));

        // Navigate to the wanted page
        const {from: {pathname}} = history.location.state || {from: {pathname: '/'}};
        history.replace(pathname);

        // Reset the login form
        await dispatch(reset());
      } else if (response.statusCode === 401) {
        dispatch(setErrors(List(['Username and password don\'t match.'])));
      }
    } catch (e) {
      dispatch(setErrors(List(['Couldn\'t connect to server. Try again later.'])));
    }
    dispatch(clearPassword());
    dispatch(setIsSubmitting(false));
  };
