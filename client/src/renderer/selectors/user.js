import type { State } from '../reducers/index';

export const isAuthenticated = (state: State) => state.user.token && state.user.privateKey;
export const getUsername = (state: State) => state.user.username;
export const getPrivateKey = (state: State) => state.user.privateKey;
export const getPublicKey = (state: State) => state.user.publicKey;
