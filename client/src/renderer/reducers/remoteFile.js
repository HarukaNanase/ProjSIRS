// @flow
import { Map } from 'immutable';
import type { Action } from 'redux';
import { RemoteFileActionTypes } from '../actions/remoteFile';
import RemoteFileState, { RemoteFile } from '../types/remoteFile';
import { NEW_DIRECTORY_ID } from '../constants/remoteFile';

const remoteFileReducer = (state: RemoteFileState = new RemoteFileState(), action: Action): RemoteFileState => {
  switch (action.type) {
    case RemoteFileActionTypes.ADD_REMOTE_FILE:
      return state.mergeIn(['entities'], Map(action.payload.map(
        (remoteFile: RemoteFile): [number, RemoteFile] =>
          [remoteFile.id, remoteFile])));

    case RemoteFileActionTypes.DELETE_REMOTE_FILE:
      return state.withMutations((mutableState: RemoteFileState) => {
        mutableState.set('entities', state.entities.removeAll(action.payload));
      });

    case RemoteFileActionTypes.ENTER_EDIT_MODE:
      return state.set('editId', action.payload);

    case RemoteFileActionTypes.EXIT_EDIT_MODE:
      return state.delete('editId');

    case RemoteFileActionTypes.ENTER_NEW_DIRECTORY_MODE:
      return state
        .set('newDirectory', new RemoteFile({ id: NEW_DIRECTORY_ID, directory: true }))
        .set('editId', NEW_DIRECTORY_ID);

    case RemoteFileActionTypes.EXIT_NEW_DIRECTORY_MODE:
      return state
        .set('newDirectory', undefined)
        .set('editId', undefined);

    case RemoteFileActionTypes.CLEAR_SELECTED_REMOTE_FILES:
      return state.set('selectedIds', state.selectedIds.clear());

    case RemoteFileActionTypes.SELECT_REMOTE_FILE: {
      if (action.payload.select) {
        return state.setIn(['selectedIds', action.payload.remoteFileId], true);
      } else {
        return state.removeIn(['selectedIds', action.payload.remoteFileId]);
      }
    }

    default:
      return state;
  }
};

export default remoteFileReducer;
