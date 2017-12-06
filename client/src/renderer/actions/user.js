// @flow
import { ipcRenderer } from '../lib/electron';
import server from '../lib/server';
import type { State } from '../reducers/index';
import type { Dispatch, PromiseAction, ThunkAction } from './index';

export const UserActionTypes = {
  SET_PRIVATE_KEY: 'USER/SET_PRIVATE_KEY',
  SET_PUBLIC_KEY: 'USER/SET_PUBLIC_KEY',
  SET_TOKEN: 'USER/SET_TOKEN',
  SET_USER: 'USER/SET_USER',
};

export const setPrivateKey = (privateKey: any) => ({
  type: UserActionTypes.SET_PRIVATE_KEY, payload: privateKey
});

export const setPublicKey = (publicKey: any) => ({
  type: UserActionTypes.SET_PUBLIC_KEY, payload: publicKey
});

export const setToken = (token?: string) => ({
  type: UserActionTypes.SET_TOKEN, payload: token,
});

export const setUser = (username: string) => ({
  type: UserActionTypes.SET_USER, payload: username
});

/**
 * Asynchronous actions
 */

/**
 * Authenticates a user.
 * @param token The token to authenticate
 * @param privateKey The private key of the user.
 * @param renew If the token should be renewed. Renew always when using a token that wasn't issued right away.
 */
export const authenticate = (token: string, privateKey: any, renew: boolean = false): ThunkAction =>
  async (dispatch: Dispatch, getState: () => State): PromiseAction => {
    // Authenticate the token.
    server.authenticate(token);
    // If renew, then renew the token.
    if (renew) {
      try {
        const {data} = await server.get('/renew');
        token = data.api_token;
        server.authenticate(token);
      } catch (error) {
        // If it was unable to renew is because it is stuck with an invalid token,
        // so remove it.
        if (error.response && error.response.status === 401) {
          dispatch(deauthenticate());
          return;
        }
      }
    }
    dispatch(setToken(token));
    dispatch(setPrivateKey(privateKey));
    // Get the public key
    const publicKey = await ipcRenderer.sendAsync('getPublicKey', privateKey);
    dispatch(setPublicKey(publicKey));
  };

/**
 * Logs out a user.
 */
export const deauthenticate = (history?: any): ThunkAction =>
  async (dispatch: Dispatch, getState: () => State): PromiseAction => {
    // If it was authenticated, logout
    if (history) {
      try {
        server.get('/logout');
      } catch (ignored) {
      }
    }
    // Stop using token
    server.deauthenticate();
    // Delete token, and keys
    dispatch(setToken(undefined));
    dispatch(setPrivateKey(undefined));
    dispatch(setPublicKey(undefined));
    // Send to /login
    if (history) {
      history.push('/login');
    }
  };
