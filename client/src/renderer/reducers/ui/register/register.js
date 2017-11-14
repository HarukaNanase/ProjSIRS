// @flow
import type { Action } from 'redux';
import { RegisterActionTypes } from '../../../actions/ui/register/register';
import RegisterState from '../../../types/ui/register/register';

const registerReducer = (state: RegisterState = new RegisterState(), action: Action): RegisterState => {
  switch (action.type) {
    case RegisterActionTypes.SET_USERNAME:
      return state.set('username', action.payload);

    case RegisterActionTypes.SET_PASSWORD:
      return state.set('password', action.payload);

    case RegisterActionTypes.SET_CONFIRM_PASSWORD:
      return state.set('confirmPassword', action.payload);

    case RegisterActionTypes.SET_CUSTOM_SECRET:
      return state.set('customSecret', action.payload);

    case RegisterActionTypes.SET_ERRORS:
      return state.set('errors', action.payload);

    case RegisterActionTypes.CLEAR_ERRORS:
      return state.delete('errors');

    case RegisterActionTypes.RESET_FORM:
      return new RegisterState();

    case RegisterActionTypes.SET_IS_SUBMITTING:
      return state.set('isSubmitting', action.payload);

    default:
      return state;
  }
};

export default registerReducer;