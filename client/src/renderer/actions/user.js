// @flow
import { ipcRenderer } from '../lib/electron';
import type { State } from '../reducers/index';
import type { Dispatch, PromiseAction, ThunkAction } from './index';

export const UserActionTypes = {
  SET_PRIVATE_KEY: 'USER/SET_PRIVATE_KEY',
  SET_PUBLIC_KEY: 'USER/SET_PUBLIC_KEY',
  SET_TOKEN: 'USER/SET_TOKEN',
  SET_USER: 'USER/SET_USER',
  LOGOUT: 'USER/LOGOUT',
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

export const logout = () => ({
  type: UserActionTypes.LOGOUT
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
    ipcRenderer.send('setToken', token);
    ipcRenderer.send('setPrivateKey', privateKey);
    // If renew, then renew the token.
    if (renew) {
      const result = await ipcRenderer.sendAsync('renew');
      if (!result.error) {
        token = result.token;
        ipcRenderer.send('setToken', token);
      } else {
        // If it was unable to renew is because it is stuck with an invalid token,
        // or the server is not there.
        dispatch(deauthenticate());
        return;
      }
    }
    dispatch(setToken(token));
    dispatch(setPrivateKey(privateKey));
    // Get the public key
    const publicKeyPem = await ipcRenderer.sendAsync('getPublicKey', privateKey);
    dispatch(setPublicKey(publicKeyPem));
  };

/**
 * Logs out a user.
 */
export const deauthenticate = (history?: any): ThunkAction =>
  async (dispatch: Dispatch, getState: () => State): PromiseAction => {
    // If it was authenticated, logout
    if (history) {
      ipcRenderer.send('logout');
    }
    // Stop using token
    ipcRenderer.send('setToken', undefined);
    ipcRenderer.send('setPrivateKey', undefined);
    // Log out, which resets the store
    dispatch(logout());
    // Send to /login
    if (history) {
      history.push('/login');
    }
  };
