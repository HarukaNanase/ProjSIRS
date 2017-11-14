// @flow
import { Record } from 'immutable';
import LoginState from './login/login';
import RegisterState from './register/register';

type UiStateType = {
  login: LoginState,
  register: RegisterState,
};

const defaultValues: UiStateType = {
  login: new LoginState(),
  register: new RegisterState(),
};

const UiStateRecord = Record(defaultValues);

class UiState extends UiStateRecord<UiStateType> {
  login: LoginState;
  register: RegisterState;
}

export default UiState;