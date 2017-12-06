// @flow
import type { Action } from 'redux';
import { UserActionTypes } from '../actions/user';
import UserState from '../types/user';

const userReducer = (state: UserState = new UserState(), action: Action): UserState => {
  switch (action.type) {
    case UserActionTypes.SET_PRIVATE_KEY:
      return state.set('privateKey', action.payload);

    case UserActionTypes.SET_PUBLIC_KEY:
      return state.set('publicKey', action.payload);

    case UserActionTypes.SET_TOKEN:
      return state.set('token', action.payload);

    case UserActionTypes.SET_USER:
      return state.set('username', action.payload);

    default:
      return state;
  }
};

export default userReducer;