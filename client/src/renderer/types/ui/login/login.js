// @flow
import { List, Record } from 'immutable';

type LoginStateType = {
  username: string,
  password: string,
  customSecret: string,
  errors: List<string>,
  isSubmitting: boolean,
};

const defaultValues: LoginStateType = {
  username: '',
  password: '',
  customSecret: '',
  errors: List(),
  isSubmitting: false,
};

const LoginStateRecord = Record(defaultValues);

class LoginState extends LoginStateRecord<LoginStateType> {
  username: string;
  password: string;
  customSecret: string;
  errors: List<string>;
  isSubmitting: boolean;
}

export default LoginState;