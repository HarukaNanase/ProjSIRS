// @flow
import server from '../lib/server';
import type { State } from '../reducers/index';
import type { Dispatch, PromiseAction, ThunkAction } from './index';

export const UserActionTypes = {
  SET_PRIVATE_KEY: 'USER/SET_PRIVATE_KEY',
  SET_PUBLIC_KEY: 'USER/SET_PUBLIC_KEY'
};

export const setPrivateKey = (privateKey: any) => ({
  type: UserActionTypes.SET_PRIVATE_KEY, payload: privateKey
});

export const setPublicKey = (publicKey: any) => ({
  type: UserActionTypes.SET_PUBLIC_KEY, payload: publicKey
});

/**
 * Authenticates a token
 * @param token The token to authenticate
 */
export const authenticate = (token: string): ThunkAction =>
  async (dispatch: Dispatch, getState: () => State): PromiseAction => {
    // Authenticate the token.
    await server.authenticate(token);
  };

/**
 * Logs out
 */
export const deauthenticate = (history: any): ThunkAction =>
  async (dispatch: Dispatch): PromiseAction => {
    // Deauthenticate on server
    await server.deauthenticate();

    // Navigate
    history.push('/login');
  };
