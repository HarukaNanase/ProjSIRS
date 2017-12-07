// @flow
import { List, Set } from 'immutable';
import { isRootDirectory } from '../constants/remoteFile';
import electron, { ipcRenderer } from '../lib/electron';
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
const deleteRemoteFiles = (remoteFileIds: List<number>) => ({
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
export const shareRemoteFile = (remoteFileId: number, usernames: List<string>): ThunkAction =>
  async (dispatch: Dispatch, getState: () => State): PromiseAction => {
    console.log('Sharing file', remoteFileId, 'with', usernames.toJS());
    dispatch(setLoadingRemotePath(true));
    const remoteFile = getRemoteFileSelectors(remoteFileId).getRemoteFile(getState());
    const result = await ipcRenderer.sendAsync('shareFile', remoteFileId, usernames.toArray());
    if (!result.error) {
      // Add the users to the list of shared users.
      dispatch(addRemoteFiles(List([
        remoteFile.set('membersUsernames', remoteFile.membersUsernames.merge(List(result.usernames)))
      ])));
    } else {
      electron.renderer.showErrorBox('Something went wrong :(', 'Unable to share the file right now! Try again later.');
    }
    dispatch(setLoadingRemotePath(false));
  };

export const revokeRemoteFile = (remoteFileId: number, usernames: List<string>): ThunkAction =>
  async (dispatch: Dispatch, getState: () => State): PromiseAction => {
    if (!usernames.size) return;
    console.log('Revoking access from file', remoteFileId, 'from', usernames.toArray());
    dispatch(setLoadingRemotePath(true));
    const result = await ipcRenderer.sendAsync('revokeFile', remoteFileId, usernames.toArray());
    if (!result.error) {
      const remoteFile = getRemoteFileSelectors(remoteFileId).getRemoteFile(getState());
      // Remove the users from the members and mark the file as it needs reciphering.
      const newMembersList = remoteFile.membersUsernames.filter((username) => !usernames.contains(username));
      dispatch(addRemoteFiles(
        List([
          remoteFile
            .set('membersUsernames', newMembersList)
            .set('needsReciphering', true)
        ])
      ));
    } else {
      electron.renderer.showErrorBox('Something went wrong :(', 'Unable to revoke the file right now! Try again later.');
    }
    dispatch(setLoadingRemotePath(false));
  };

/**
 * Downloads a given file to the given path.
 * @param remoteFileId The file to download.
 * @param filePath The path of the file.
 */
export const downloadRemoteFile = (remoteFileId: number, filePath: string): ThunkAction =>
  async (dispatch: Dispatch, getState: () => State): PromiseAction => {
    console.log('Downloading file to', remoteFileId, 'to', filePath);
    const remoteFileKey = getRemoteFileSelectors(remoteFileId).getRemoteFileKey(getState());
    dispatch(setLoadingRemotePath(true));
    const result = await ipcRenderer.sendAsync('downloadFile', remoteFileId, remoteFileKey, filePath);
    if (!result.error) {
      if (!result.deciphered) {
        electron.renderer.showErrorBox('Unable to decipher the file', 'The file was probably tampered with on the server. We are truly sorry for your loss, but at least they didn\'t got to see the content!');
      }
    } else {
      electron.renderer.showErrorBox('Something went wrong :(', 'Unable to download the file right now! Try again later.');
    }
    dispatch(setLoadingRemotePath(false));
  };

/**
 * Uploads some given files to the directory with the given file id.
 * @param parentRemoteFileId The id of the directory to upload to.
 * @param filePath The files path in relation the client of the file to be uploaded.
 */
export const uploadRemoteFile = (parentRemoteFileId: number, filePath: string): ThunkAction =>
  async (dispatch: Dispatch, getState: () => State): PromiseAction => {
    // Prepare the file upload.
    const preparation = prepareFileUpload(getState(), parentRemoteFileId);
    if (!preparation) return;
    dispatch(setLoadingRemotePath(true));
    // Use the filename of the in the path as the name.
    const name = await ipcRenderer.sendAsync('getFilename', filePath);
    // Make the request.
    const result = await ipcRenderer.sendAsync('uploadFile',
      preparation.allMembersUsernames,
      name,
      preparation.parent,
      filePath
    );
    if (!result.error) {
      // Add the new remote file with the new id.
      const remoteDirectory = new RemoteFile({
        id: result.id, name, key: result.key,
        ownerUsername: preparation.ownerUsername, membersUsernames: preparation.membersUsernames
      });
      dispatch(addRemoteFiles(List([remoteDirectory])));
      // Fetch the old files of the parent.
      const files = getRemotePathSelectors(parentRemoteFileId).getRemoteFiles(getState());
      // Add the new directory into that list of files.
      dispatch(addRemotePath(parentRemoteFileId, files.push(remoteDirectory)));
    } else {
      electron.renderer.showErrorBox('Something went wrong :(', 'Unable to upload a file right now! Try again later.');
    }
    dispatch(setLoadingRemotePath(false));
  };

/**
 * Edits a given file id to the given one.
 * @param remoteFileId The remote file identifier of the file to be edited.
 * @param filePath The new file path in relation the client.
 */
export const editRemoteFile = (remoteFileId: number, filePath: string): ThunkAction =>
  async (dispatch: Dispatch, getState: () => State): PromiseAction => {
    console.log('Editing file', remoteFileId, 'with', filePath);
    // Get the file's key.
    const remoteFile = getRemoteFileSelectors(remoteFileId).getRemoteFile(getState());
    dispatch(setLoadingRemotePath(true));
    const result = await ipcRenderer.sendAsync('updateFile',
      remoteFileId,
      remoteFile.key,
      filePath,
      remoteFile.needsReciphering,
      remoteFile.name,
      remoteFile.allMembers.toArray(),
    );
    if (!result.error) {
      // Add the new remote file with the new key and with needs reciphering false.
      dispatch(addRemoteFiles(
        List([
          remoteFile
            .set('key', result.key)
            .set('needsReciphering', false)
        ])
      ));
    } else {
      electron.renderer.showErrorBox('Something went wrong :(', 'Unable to edit the file right now! Try again later.');
    }
    dispatch(setLoadingRemotePath(false));
  };

/**
 * Creates a new directory in the given directory with the given name.
 * @param parentRemoteFileId The id of the of the directory to save the new directory into.
 * @param name The name of the new directory.
 */
export const newRemoteDirectory = (parentRemoteFileId: number, name: string): ThunkAction =>
  async (dispatch: Dispatch, getState: () => State): PromiseAction => {
    // Prepare the file upload.
    const preparation = prepareFileUpload(getState(), parentRemoteFileId);
    if (!preparation) return;
    dispatch(setLoadingRemotePath(true));
    const result = await ipcRenderer.sendAsync('uploadFile',
      preparation.allMembersUsernames,
      name,
      preparation.parent,
    );
    if (!result.error) {
      // Add the new remote directory with the new id.
      const remoteDirectory = new RemoteFile({
        id: result.id, directory: true, name, key: result.key,
        ownerUsername: preparation.ownerUsername, membersUsernames: preparation.membersUsernames
      });
      dispatch(addRemoteFiles(List([remoteDirectory])));
      // Fetch the old files of the parent.
      const files = getRemotePathSelectors(parentRemoteFileId).getRemoteFiles(getState());
      // Add the new directory into that list of files.
      dispatch(addRemotePath(parentRemoteFileId, files.push(remoteDirectory)));
    } else {
      electron.renderer.showErrorBox('Something went wrong :(', 'Unable to create a directory right now! Try again later.');
    }
    dispatch(setLoadingRemotePath(false));
  };

/**
 * Renames a given remote file to the given name.
 * @param remoteFileId The remote file identifier.
 * @param name The new name of the file.
 */
export const renameRemoteFile = (remoteFileId: number, name: string): ThunkAction =>
  async (dispatch: Dispatch, getState: () => State): PromiseAction => {
    const remoteFile = getRemoteFileSelectors(remoteFileId).getRemoteFile(getState());
    dispatch(setLoadingRemotePath(true));
    const result = await ipcRenderer.sendAsync('renameFile',
      remoteFileId,
      remoteFile.key,
      name,
      remoteFile.needsReciphering && remoteFile.directory,
      remoteFile.allMembers.toArray()
    );
    if (!result.error) {
      // Add the new remote file with the new key and with needs reciphering false.
      dispatch(addRemoteFiles(
        List([
          remoteFile
            .set('name', name)
            .set('key', result.key)
            .set('needsReciphering', false)
        ])
      ));
      dispatch(exitEditMode());
    } else {
      electron.renderer.showErrorBox('Something went wrong :(', 'Unable to rename the file right now! Try again later.');
    }
    dispatch(setLoadingRemotePath(false));
  };

/**
 * Deletes all given remote files belonging to a given directory id.
 * @param parentId The directory id where the files belong to.
 * @param remoteFilesIds A list of remote file identifiers to be deleted.
 */
export const deleteRemoteFile = (parentId: number, remoteFilesIds: List<number>): ThunkAction =>
  async (dispatch: Dispatch, getState: () => State): PromiseAction => {
    dispatch(setLoadingRemotePath(true));
    // Delete all files one by one and wait for all.
    const response = await ipcRenderer.sendAsync('deleteFile', remoteFilesIds.toArray());
    if (!response.error) {
      // If no error is thrown, apply the changes.
      dispatch(clearSelectedRemoteFiles());
      dispatch(removeRemoteFileFromRemotePath(parentId, remoteFilesIds));
      dispatch(deleteRemoteFiles(remoteFilesIds));
    } else {
      electron.renderer.showErrorBox('Something went wrong :(', 'Unable to delete the file right now! Try again later.');
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
const prepareFileUpload = (state: State, parentRemoteFileId: number): {
  parent?: number,
  membersUsernames: List<string>,
  ownerUsername: string,
  allMembersUsernames: Array<string>,
} | null => {
  // Check if the parent is the root, if so, then there is no parent.
  const parent = !isRootDirectory(parentRemoteFileId) ? parentRemoteFileId : undefined;
  // When creating a new file you are the only owner.
  let membersUsernames = List();
  // If there is a parent other than the root, then share the new file with all of the members.
  let ownerUsername = getUsername(state);
  if (parent) {
    const parentRemoteFile = getRemoteFileSelectors(parentRemoteFileId).getRemoteFile(state);
    if (!parentRemoteFile) return null;
    membersUsernames = parentRemoteFile.membersUsernames;
    ownerUsername = parentRemoteFile.ownerUsername;
  }
  return {
    parent,
    allMembersUsernames: Set(membersUsernames).add(ownerUsername).toArray(),
    ownerUsername,
    membersUsernames,
  };
};