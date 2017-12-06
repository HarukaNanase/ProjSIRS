// @flow
import { Record } from 'immutable';

type UserStateType = {
  username?: string,
  token?: string,
  privateKey?: any,
  publicKey?: any,
};

const defaultValues: UserStateType = {
  username: undefined,
  token: undefined,
  privateKey: undefined,
  publicKey: undefined,
};

const UserStateRecord = Record(defaultValues);

class UserState extends UserStateRecord<UserStateType> {
  username: string;
  token: string;
  privateKey: any;
  publicKey: any;
}

export default UserState;