// @flow
import type { Action } from 'redux';
import { LoginActionTypes } from '../../../actions/ui/login/login';
import LoginState from '../../../types/ui/login/login';

const loginReducer = (state: LoginState = new LoginState(), action: Action): LoginState => {
  switch (action.type) {
    case LoginActionTypes.SET_USERNAME:
      return state.set('username', action.payload);

    case LoginActionTypes.SET_PASSWORD:
      return state.set('password', action.payload);

    case LoginActionTypes.SET_CUSTOM_SECRET:
      return state.set('customSecret', action.payload);

    case LoginActionTypes.PASSWORD_CLEAR:
      return state.delete('password');

    case LoginActionTypes.SET_ERRORS:
      return state.set('errors', action.payload);

    case LoginActionTypes.CLEAR_ERRORS:
      return state.delete('errors');

    case LoginActionTypes.RESET_FORM:
      return new LoginState();

    case LoginActionTypes.SET_IS_SUBMITTING:
      return state.set('isSubmitting', action.payload);

    default:
      return state;
  }
};

export default loginReducer;