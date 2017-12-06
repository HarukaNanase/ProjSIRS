// @flow
import { List } from 'immutable';
import { isRootDirectory } from '../constants/remoteFile';
import { ipcRenderer } from '../lib/electron';
import server from '../lib/server';
import type { State } from '../reducers/index';
import { getPrivateKey } from '../selectors/user';
import { RemoteFile } from '../types/remoteFile';
import type { Dispatch, PromiseAction, ThunkAction } from './index';
import { addRemoteFiles } from './remoteFile';

export const RemotePathActionTypes = {
  ADD_REMOTE_PATH: 'REMOTE_PATH/ADD_REMOTE_PATH',
  REMOVE_REMOTE_FILE_FROM_REMOTE_PATH: 'REMOTE_PATH/REMOVE_REMOTE_FILE_FROM_REMOTE_PATH',
  SET_LOADING_REMOTE_PATH: 'REMOTE_PATH/SET_LOADING_REMOTE_PATH',
};

/**
 * Adds a remote path or remote paths to the remote file list.
 * @param remoteFileId The id of the directory where to add the files or file.
 * @param remoteFile or remote files to be added.
 */
export const addRemotePath = (remoteFileId: number, remoteFile: RemoteFile | List<RemoteFile>) => ({
  type: RemotePathActionTypes.ADD_REMOTE_PATH,
  payload: {
    remoteFileId,
    remoteFiles: (List.isList(remoteFile) || Array.isArray(remoteFile) ) ? List(remoteFile) : List([remoteFile])
  },
});

/**
 * Removes the given remote files from the directory with the given id.
 * @param remoteFileId The id of the directory to remove the files from.
 * @param remoteFilesIds The identifiers of the files to be removed.
 */
export const removeRemoteFileFromRemotePath = (remoteFileId: number, remoteFilesIds: List<number>) => ({
  type: RemotePathActionTypes.REMOVE_REMOTE_FILE_FROM_REMOTE_PATH,
  payload: {
    remoteFileId,
    remoteFilesIds: List(remoteFilesIds)
  },
});

/**
 * Sets the loading remote flag to the given value.
 * @param value The new value of the flag.
 */
export const setLoadingRemotePath = (value: boolean) => ({
  type: RemotePathActionTypes.SET_LOADING_REMOTE_PATH,
  payload: value
});

/**
 * Asynchronous actions
 */

/**
 * Loads all files from the given directory id.
 * @param remoteFileId The id of the directory to be loaded.
 */
export const loadRemotePath = (remoteFileId: number): ThunkAction =>
  async (dispatch: Dispatch, getState: () => State): PromiseAction => {
    dispatch(setLoadingRemotePath(true));
    try {
      // Perform the request.
      const directoryId = !isRootDirectory(remoteFileId) ? remoteFileId : undefined;
      const {files} = await ipcRenderer.sendAsync('loadRemotePath',
        server.info,
        getPrivateKey(getState()),
        directoryId,
      );
      // Transform the response to files.
      const remoteFiles = List(files.map(
        (file) => new RemoteFile({
          ...file,
          ownerUsername: file.owner,
          membersUsernames: List(file.shared),
          modified: new Date(file.modified * 1000),
          created: new Date(file.created * 1000),
          needsReciphering: file.needs_reciphering === 1,
        })
      ));
      // Add the files and the path.
      await dispatch(addRemoteFiles(remoteFiles));
      await dispatch(addRemotePath(remoteFileId, remoteFiles));
    } catch (ignored) {
    }
    dispatch(setLoadingRemotePath(false));
  };