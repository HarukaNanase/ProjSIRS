// @flow
import { List, Map, Record } from 'immutable';

type RemotePathType = {
  remoteFileId: number,
  remoteFilesIds: List<number>,
};

const remotePathDefaultValues: RemotePathType = {
  remoteFileId: 0,
  remoteFilesIds: List(),
};

const RemotePathRecord = Record(remotePathDefaultValues);

export class RemotePath extends RemotePathRecord<RemotePathType> {
  remoteFileId: number;
  remoteFilesIds: List<number>;
}

export type RemotePathMapType = Map<number, RemotePath>;

type RemotePathStateType = {
  entities: RemotePathMapType,
  loadingRemotePath: boolean,
};

const defaultValues: RemotePathStateType = {
  entities: Map(),
  loadingRemotePath: false,
};

const RemotePathStateRecord = Record(defaultValues);

class RemotePathState extends RemotePathStateRecord<RemotePathType> {
  entities: RemotePathMapType;
  loadingRemotePath: boolean;
}

export default RemotePathState;
