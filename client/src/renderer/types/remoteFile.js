// @flow
import { Map, Record, List, Set } from 'immutable';

type RemoteFileType = {
  id: number,
  name: string,
  size: number,
  directory: boolean;
  created: Date,
  modified: Date,
  ownerUsername: string,
  membersUsernames: List<string>,
  key: string,
  needsReciphering: boolean,
};

const remoteFileDefaultValues: RemoteFileType = {
  id: 0,
  name: '',
  size: 0,
  directory: false,
  created: new Date(),
  modified: new Date(),
  ownerUsername: '',
  membersUsernames: List(),
  key: '',
  needsReciphering: false,
};

const RemoteFileRecord = Record(remoteFileDefaultValues);

export class RemoteFile extends RemoteFileRecord<RemoteFileType> {
  id: number;
  name: string;
  directory: false;
  created: Date;
  modified: Date;
  ownerUsername: string;
  membersUsernames: List<string>;
  key: string;
  needsReciphering: boolean;

  get allMembers(): List<string> {
    return Set(this.membersUsernames).add(this.ownerUsername).toList();
  }
}

export type RemoteFileMapType = Map<number, RemoteFile>;

type RemoteFileStateType = {
  entities: RemoteFileMapType,
  newDirectory?: RemoteFile,
  editId?: number,
  selectedIds: Map<number, boolean>,
};

const defaultValues: RemoteFileStateType = {
  entities: Map(),
  newDirectory: undefined,
  editId: undefined,
  selectedIds: Map(),
};

const RemoteFileStateRecord = Record(defaultValues);

class RemoteFileState extends RemoteFileStateRecord<RemoteFileStateType> {
  entities: RemoteFileMapType;
  newDirectory: RemoteFile;
  editId: number;
  selectedIds: Map<number, boolean>;
}

export default RemoteFileState;
