// @flow
import type { Action } from 'redux';
import UiState from '../../types/ui/ui';
import slicer from '../util';
import loginReducer from './login/login';
import registerReducer from './register/register';

const loginSlice = slicer(['login'], loginReducer);
const registerSlice = slicer(['register'], registerReducer);

const uiReducer = (state: UiState = new UiState(), action: Action): UiState => {
  switch (action.type) {
    default:
      return state.withMutations((mutableState: UiState) => {
        loginSlice(mutableState, action);
        registerSlice(mutableState, action);
      });
  }
};

export default uiReducer;