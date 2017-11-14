// @flow
import { List, Record } from 'immutable';

type RegisterStateType = {
  username: string,
  password: string,
  confirmPassword: string,
  customSecret: string,
  errors: List<string>,
  isSubmitting: boolean,
};

const defaultValues: RegisterStateType = {
  username: '',
  password: '',
  confirmPassword: '',
  customSecret: '',
  errors: List(),
  isSubmitting: false,
};

const RegisterStateRecord = Record(defaultValues);

class RegisterState extends RegisterStateRecord<RegisterStateType> {
  username: string;
  password: string;
  confirmPassword: string;
  customSecret: string;
  errors: List<string>;
  isSubmitting: boolean;
}

export default RegisterState;