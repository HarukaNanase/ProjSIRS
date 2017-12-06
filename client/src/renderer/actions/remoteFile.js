// @flow
import { List } from 'immutable';
import { isRootDirectory } from '../constants/remoteFile';
import { ipcRenderer } from '../lib/electron';
import server from '../lib/server';
import type { State } from '../reducers/index';
import { getRemoteFileSelectors } from '../selectors/remoteFile';
import { getRemotePathSelectors } from '../selectors/remotePath';
import { getUsername } from '../selectors/user';
import { RemoteFile } from '../types/remoteFile';
import type { Dispatch, PromiseAction, ThunkAction } from './index';
import { addRemotePath, removeRemoteFileFromRemotePath, setLoadingRemotePath } from './remotePath';

export const RemoteFileActionTypes = {
  ADD_REMOTE_FILE: 'REMOTE_FILE/ADD_REMOTE_FILE',
  DELETE_REMOTE_FILE: 'REMOTE_FILE/DELETE_REMOTE_FILE',
  ENTER_EDIT_MODE: 'REMOTE_FILE/ENTER_EDIT_MODE',
  EXIT_EDIT_MODE: 'REMOTE_FILE/EXIT_EDIT_MODE',
  ENTER_NEW_DIRECTORY_MODE: 'REMOTE_FILE/ENTER_NEW_DIRECTORY_MODE',
  EXIT_NEW_DIRECTORY_MODE: 'REMOTE_FILE/EXIT_NEW_DIRECTORY_MODE',
  SELECT_REMOTE_FILE: 'REMOTE_FILE/SELECT_REMOTE_FILE',
  CLEAR_SELECTED_REMOTE_FILES: 'REMOTE_FILE/CLEAR_SELECTED_REMOTE_FILES',
};

/**
 * Sets the edit mode of a given remote file.
 * Note: Use undefined to remove edit mode.
 * @param remoteFileId The remote file identifier.
 */
export const enterEditMode = (remoteFileId: number) => ({
  type: RemoteFileActionTypes.ENTER_EDIT_MODE,
  payload: remoteFileId,
});

/**
 * Exits edit mode.
 */
export const exitEditMode = () => ({
  type: RemoteFileActionTypes.EXIT_EDIT_MODE,
});

/**
 * Selects/Un-selects a given remote file using the given value.
 * @param remoteFileId The remote file identifier.
 * @param select If the file is selected or not.
 */
export const selectRemoteFile = (remoteFileId: number, select: boolean) => ({
  type: RemoteFileActionTypes.SELECT_REMOTE_FILE,
  payload: {
    remoteFileId,
    select
  },
});

/**
 * Clears all selected remote files.
 */
export const clearSelectedRemoteFiles = () => ({
  type: RemoteFileActionTypes.CLEAR_SELECTED_REMOTE_FILES,
});

/**
 * Adds remote files to the remote file list.
 * @param remoteFiles to be added.
 */
export const addRemoteFiles = (remoteFiles: List<RemoteFile>) => ({
  type: RemoteFileActionTypes.ADD_REMOTE_FILE,
  payload: List(remoteFiles),
});

/**
 * Removes remote files from the remote files map.
 * @param remoteFileIds to be removed.
 */
export const deleteRemoteFile = (remoteFileIds: List<number>) => ({
  type: RemoteFileActionTypes.DELETE_REMOTE_FILE,
  payload: List(remoteFileIds),
});

/**
 * Enters new directory mode.
 */
export const enterNewDirectoryMode = () => ({
  type: RemoteFileActionTypes.ENTER_NEW_DIRECTORY_MODE,
});

/**
 * Exits new directory mode.
 */
export const exitNewDirectoryMode = () => ({
  type: RemoteFileActionTypes.EXIT_NEW_DIRECTORY_MODE,
});

/**
 * Asynchronous actions
 */

/**
 * Shares a given remote file with a given set of usernames.
 * @param remoteFileId The remote file identifier.
 * @param usernames A list of usernames to share the file with.
 */
export const saveShareRemoteFile = (remoteFileId: number, usernames: List<string>): ThunkAction =>
  async (dispatch: Dispatch, getState: () => State): PromiseAction => {
    console.log('Sharing file', remoteFileId, 'with', usernames.toJS());
    const remoteFile = getRemoteFileSelectors(remoteFileId).getRemoteFile(getState());
    const result = await ipcRenderer.sendAsync('shareFile',
      server.info,
      remoteFile.key,
      remoteFileId,
      usernames.toArray()
    );
    // Add the users to the list of shared users.
    dispatch(addRemoteFiles(List([remoteFile.set('membersUsernames', remoteFile.membersUsernames.merge(List(result.usernames)))])))
  };

export const saveRevokeFile = (remoteFileId: number, usernames: List<string>): ThunkAction =>
  async (dispatch: Dispatch, getState: () => State): PromiseAction => {
    if (!usernames.size) return;
    console.log('Revoking access from file', remoteFileId, 'from', usernames.toArray());
    const result = await ipcRenderer.sendAsync('revokeFile',
      server.info,
      remoteFileId,
      usernames.toArray()
    );
    const remoteFile = getRemoteFileSelectors(remoteFileId).getRemoteFile(getState());
    // Remove the users from the members.
    const newMembersList = remoteFile.membersUsernames.filter((username) => !usernames.contains(username));
    dispatch(addRemoteFiles(List([remoteFile.set('membersUsernames', newMembersList)])))
  };

/**
 * Downloads a given file to the given path.
 * @param remoteFileId The file to download.
 * @param filePath The path of the file.
 */
export const downloadFile = (remoteFileId: number, filePath: string): ThunkAction =>
  async (dispatch: Dispatch, getState: () => State): PromiseAction => {
    console.log('Downloading file to', remoteFileId, 'to', filePath);
    const remoteFileKey = getRemoteFileSelectors(remoteFileId).getRemoteFileKey(getState());
    dispatch(setLoadingRemotePath(true));
    const result = await ipcRenderer.sendAsync('downloadFile',
      server.info,
      remoteFileKey,
      remoteFileId,
      filePath
    );
    dispatch(setLoadingRemotePath(false));
  };

/**
 * Uploads some given files to the directory with the given file id.
 * @param parentRemoteFileId The id of the directory to upload to.
 * @param filePath The files path in relation the client of the file to be uploaded.
 */
export const saveUploadFile = (parentRemoteFileId: number, filePath: string): ThunkAction =>
  async (dispatch: Dispatch, getState: () => State): PromiseAction => {
    // Prepare the file upload.
    const result = prepareFileUpload(getState(), parentRemoteFileId);
    if (!result) return;
    // Use the filename of the in the path as the name.
    const name = await ipcRenderer.sendAsync('getFilename', filePath);

    dispatch(setLoadingRemotePath(true));
    // Make the request.
    const {id, key} = await ipcRenderer.sendAsync('uploadFile',
      server.info,
      result.sharedUsernames,
      name,
      result.parent,
      filePath
    );
    // Add the new remote file with the new id.
    const remoteDirectory = new RemoteFile({id, name, key});
    dispatch(addRemoteFiles(List([remoteDirectory])));
    // Fetch the old files of the parent.
    const files = getRemotePathSelectors(parentRemoteFileId).getRemoteFiles(getState());
    // Add the new directory into that list of files.
    dispatch(addRemotePath(parentRemoteFileId, files.push(remoteDirectory)));
    dispatch(setLoadingRemotePath(false));
  };

/**
 * Edits a given file id to the given one.
 * @param remoteFileId The remote file identifier of the file to be edited.
 * @param filePath The new file path in relation the client.
 */
export const saveEditFile = (remoteFileId: number, filePath: string): ThunkAction =>
  async (dispatch: Dispatch, getState: () => State): PromiseAction => {
    console.log('Editing file', remoteFileId, 'with', filePath);
    // Get the file's key.
    const remoteFileKey = getRemoteFileSelectors(remoteFileId).getRemoteFileKey(getState());
    dispatch(setLoadingRemotePath(true));
    const success = await ipcRenderer.sendAsync('editFile',
      server.info,
      remoteFileKey,
      remoteFileId,
      filePath,
    );
    dispatch(setLoadingRemotePath(false));
  };

/**
 * Creates a new directory in the given directory with the given name.
 * @param parentRemoteFileId The id of the of the directory to save the new directory into.
 * @param name The name of the new directory.
 */
export const saveNewRemoteDirectory = (parentRemoteFileId: number, name: string): ThunkAction =>
  async (dispatch: Dispatch, getState: () => State): PromiseAction => {
    // Prepare the file upload.
    const result = prepareFileUpload(getState(), parentRemoteFileId);
    if (!result) return;
    dispatch(setLoadingRemotePath(true));
    try {
      const {id, key} = await ipcRenderer.sendAsync('uploadFile',
        server.info,
        result.sharedUsernames,
        name,
        result.parent,
      );
      // Add the new remote directory with the new id.
      const remoteDirectory = new RemoteFile({id, directory: true, name, key});
      dispatch(addRemoteFiles(List([remoteDirectory])));
      // Fetch the old files of the parent.
      const files = getRemotePathSelectors(parentRemoteFileId).getRemoteFiles(getState());
      // Add the new directory into that list of files.
      dispatch(addRemotePath(parentRemoteFileId, files.push(remoteDirectory)));
    } catch (error) {
    }
    dispatch(setLoadingRemotePath(false));
  };

/**
 * Renames a given remote file to the given name.
 * @param remoteFileId The remote file identifier.
 * @param name The new name of the file.
 */
export const saveRenameRemoteFile = (remoteFileId: number, name: string): ThunkAction =>
  async (dispatch: Dispatch, getState: () => State): PromiseAction => {
    const remoteFile = getRemoteFileSelectors(remoteFileId).getRemoteFile(getState());
    // Set the new name before trying the rename.
    const oldName = remoteFile.name;
    dispatch(addRemoteFiles(List([remoteFile.set('name', name)])));
    dispatch(exitEditMode());
    const success = await ipcRenderer.sendAsync('renameFile',
      server.info,
      remoteFile.key,
      remoteFileId,
      name
    );
    if (!success) {
      // If the rename fails, set the name back to the old one.
      dispatch(addRemoteFiles(List([remoteFile.set('name', oldName)])));
    }
  };

/**
 * Deletes all given remote files belonging to a given directory id.
 * @param parentId The directory id where the files belong to.
 * @param remoteFilesIds A list of remote file identifiers to be deleted.
 */
export const saveDeleteRemoteFile = (parentId: number, remoteFilesIds: List<number>): ThunkAction =>
  async (dispatch: Dispatch, getState: () => State): PromiseAction => {
    dispatch(setLoadingRemotePath(true));
    // Get the remote files of the parent.
    const remoteFilesIds = getRemotePathSelectors(parentId).getRemoteFilesIds(getState());
    try {
      // Delete all files one by one and wait for all.
      await Promise.all(remoteFilesIds.map(async (fileId) => {
        await server.delete(`/file/${fileId}`);
      }));
      // If no error is thrown, apply the changes.
      dispatch(clearSelectedRemoteFiles());
      dispatch(removeRemoteFileFromRemotePath(parentId, remoteFilesIds));
      dispatch(deleteRemoteFile(remoteFilesIds));
    } catch (error) {
      // If some error happened, don't do anything, and keep the items selected.
    }
    dispatch(setLoadingRemotePath(false));
  };

/**
 * Utilities
 */

/**
 * Prepares file upload by getting the parent and the shared members to use in file uploads.
 * @param state The store's state.
 * @param parentRemoteFileId The identifier of the parent.
 * @returns Null if the parent file doesn't exist in the store. The parent and the shared usernames otherwise.
 */
const prepareFileUpload = (state: State, parentRemoteFileId: number): { parent?: number, sharedUsernames: Array<string> } | null => {
  // Check if the parent is the root, if so, then there is no parent.
  const parent = !isRootDirectory(parentRemoteFileId) ? parentRemoteFileId : undefined;
  // When creating a new file you are the only owner.
  let sharedUsernames = [getUsername(state)];
  // If there is a parent other than the root, then share the new file with all of the members.
  if (parent) {
    const parentRemoteFile = state.remoteFile.entities.get(parentRemoteFileId);
    if (!parentRemoteFile) return null;
    sharedUsernames = parentRemoteFile.sharedUsernames;
  }
  return {
    parent,
    sharedUsernames,
  };
};