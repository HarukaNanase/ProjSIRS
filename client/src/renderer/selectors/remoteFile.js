// @flow
import { List, Map } from 'immutable';
import { createSelector } from 'reselect';
import type { State } from '../reducers/index';
import type { RemoteFileMapType } from '../types/remoteFile';
import { RemoteFile } from '../types/remoteFile';

export type RemoteFileSelectorsType = {
  getRemoteFile: (state: State) => RemoteFile,
  getRemoteFileKey: (state: State) => string,
};

export const getRemoteFiles = (state: State): RemoteFileMapType =>
  state.remoteFile.entities;

export const getEditId = (state: State): number =>
  state.remoteFile.editId;

export const getNewDirectory = (state: State): RemoteFile =>
  state.remoteFile.newDirectory;

export const getInEditMode = createSelector(
  [getEditId],
  (editId: number): boolean => editId !== undefined,
);

export const getInNewDirectoryMode = createSelector(
  [getNewDirectory],
  (newDirectory: RemoteFile) => newDirectory !== undefined,
);

export const getSelectedIds = (state: State): Map<number, boolean> =>
  state.remoteFile.selectedIds;

export const getSelectedCount = createSelector(
  [getSelectedIds],
  (selectedIds: Map<number, boolean>): number =>
    selectedIds.size,
);

export const getSelectedRemoteFiles = createSelector(
  [getSelectedIds, getRemoteFiles],
  (selectedIds: Map<number, boolean>, remoteFiles: RemoteFileMapType): List<RemoteFile> =>
    selectedIds.keySeq().toList().map((remoteFileId: number) => remoteFiles.get(remoteFileId, new RemoteFile()))
);

const selectors = Map().asMutable();

const createSelectors = (remoteFileId: number): RemoteFileSelectorsType => {
  const getRemoteFile = createSelector(
    [getRemoteFiles],
    (remoteFiles: RemoteFileMapType) => remoteFiles.get(remoteFileId)
  );
  const getRemoteFileKey = createSelector(
    [getRemoteFile],
    (remoteFile: RemoteFile) => remoteFile.key
  );
  return {
    getRemoteFile,
    getRemoteFileKey,
  };
};

export const getRemoteFileSelectors = (remoteFileId: number): RemoteFileSelectorsType => {
  if (!selectors.has(remoteFileId)) {
    selectors.set(remoteFileId, createSelectors(remoteFileId));
  }
  // $FlowFixMe
  return selectors.get(remoteFileId);
};