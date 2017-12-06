// @flow
import { List } from 'immutable';
import type { Action } from 'redux';
import { RemotePathActionTypes } from '../actions/remotePath';
import { RemoteFile } from '../types/remoteFile';
import RemotePathState, { RemotePath } from '../types/remotePath';

const remotePathReducer = (state: RemotePathState = new RemotePathState(), action: Action): RemotePathState => {
  switch (action.type) {
    case RemotePathActionTypes.ADD_REMOTE_PATH:
      return state.setIn(
        ['entities', action.payload.remoteFileId],
        new RemotePath({
          remoteFileId: action.payload.remoteFileId,
          remoteFilesIds: List(action.payload.remoteFiles.map((remoteFile: RemoteFile) => remoteFile.id))
        })
      );

    case RemotePathActionTypes.REMOVE_REMOTE_FILE_FROM_REMOTE_PATH:
      return state.withMutations((mutableState: RemotePathState) => {
        const remotePath = state.entities.get(action.payload.remoteFileId);
        const newList = List().asMutable();
        remotePath.remoteFilesIds.forEach((remoteFileId: number) => {
          if (action.payload.remoteFilesIds.indexOf(remoteFileId) === -1)
            newList.push(remoteFileId);
        });
        mutableState.setIn(['entities', action.payload.remoteFileId, 'remoteFilesIds'], newList.asImmutable());
      });

    case RemotePathActionTypes.SET_LOADING_REMOTE_PATH:
      return state.set('loadingRemotePath', action.payload);

    default:
      return state;
  }
};

export default remotePathReducer;
