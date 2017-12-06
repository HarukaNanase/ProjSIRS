// @flow
import { Map, Record } from 'immutable';

type UserType = {
  username: string;
}

const userDefaultValues: UserType = {
  username: ''
};

const UserRecord = Record(userDefaultValues);

export class User extends UserRecord<UserType> {
  username: string;
}

export type UserMapType = Map<string, User>;

type UserStateType = {
  entities: UserMapType,
  username?: string,
  token?: string,
  privateKey?: any,
  publicKey?: any,
};

const defaultValues: UserStateType = {
  entities: Map(),
  username: undefined,
  token: undefined,
  privateKey: undefined,
  publicKey: undefined,
};

const UserStateRecord = Record(defaultValues);

class UserState extends UserStateRecord<UserStateType> {
  entities: UserMapType;
  username: string;
  token: string;
  privateKey: any;
  publicKey: any;
}

export default UserState;