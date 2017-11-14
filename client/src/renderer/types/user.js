// @flow
import { Record } from 'immutable';

type UserStateType = {
  token?: string,
  privateKey?: any,
  publicKey?: any,
};

const defaultValues: UserStateType = {
  token: undefined,
  privateKey: undefined,
  publicKey: undefined,
};

const UserStateRecord = Record(defaultValues);

class UserState extends UserStateRecord<UserStateType> {
  token: string;
  privateKey: any;
  publicKey: any;
}

export default UserState;