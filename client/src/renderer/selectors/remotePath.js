// @flow
import { List, Map } from 'immutable';
import { createSelector } from 'reselect';
import { isRootDirectory, ROOT_ID } from '../constants/remoteFile';
import type { State } from '../reducers/index';
import type { RemoteFileMapType } from '../types/remoteFile';
import { RemoteFile } from '../types/remoteFile';
import type { RemotePathMapType } from '../types/remotePath';
import { RemotePath } from '../types/remotePath';
import { getRemoteFiles as getGlobalRemoteFiles } from './remoteFile';

export type RemotePathSelectorsType = {
  getRemotePath: (state: State) => RemotePath,
  getRemoteFilesIds: (state: State) => List<number>,
  getRemoteFiles: (state: State) => List<RemoteFile>,
};

const getCurrentPath = (state: State, props: { match: any }) => {
  const path = props.match.params.path;
  if (path === undefined) {
    return '/';
  }
  return '/' + path;
};

export const getCurrentRemoteFilesIdsPath = createSelector(
  [getCurrentPath],
  (currentPath: string): List<number> => {
    // Get all segments
    let segments = currentPath.split('/');
    // If the last segment is empty is because it was a /, so remove it
    if (segments[segments.length - 1].length === 0) {
      segments = segments.slice(0, segments.length - 1);
    }
    // Replace the first one (that is empty) with the root id.
    const ids = [ROOT_ID];
    // Convert it all to integers.
    for (let i = 1; i < segments.length; i++) {
      ids[i] = Number.parseInt(segments[i], 10);
    }
    return List(ids);
  },
);

export const getCurrentRemoteFilesIdsJoinedPath = createSelector(
  [getCurrentRemoteFilesIdsPath],
  (remoteFilesIdsPath: List<number>) => {
    // Remove the root id, since that doesn't matter.
    let remoteFilesIds = remoteFilesIdsPath.slice(1);
    let preAppendRoot = (remoteFilesIds.size > 0 ? '/' : '');
    return '/home' + preAppendRoot + remoteFilesIds.join('/');
  }
);

export const getCurrentRemoteFilesNamesPath = createSelector(
  [getCurrentRemoteFilesIdsPath, getGlobalRemoteFiles],
  (remoteFilesIdsPath: List<number>, remoteFiles: RemoteFileMapType) =>
    remoteFilesIdsPath.map((remoteFileId: number) => {
      if (isRootDirectory(remoteFileId)) return 'Home';
      const remoteFile = remoteFiles.get(remoteFileId);
      if (!remoteFile) return 'Loading';
      return remoteFile.name;
    }),
);

export const getCurrentRemoteFileId = createSelector(
  [getCurrentRemoteFilesIdsPath],
  (remoteFilesIdsPath) => remoteFilesIdsPath.last()
);

export const getRemotePaths = (state: State): RemotePathMapType =>
  state.remotePath.entities;

export const getLoadingRemotePath = (state: State): boolean =>
  state.remotePath.loadingRemotePath;

const selectors = Map().asMutable();

const createSelectors = (remoteFileId: number): RemotePathSelectorsType => {
  const getRemotePath = createSelector(
    [getRemotePaths],
    (remotePaths: RemotePathMapType) => remotePaths.get(remoteFileId, new RemotePath({remoteFileId}))
  );
  const getRemoteFilesIds = createSelector(
    [getRemotePath],
    (remotePath: RemotePath) => remotePath.remoteFilesIds
  );
  const getRemoteFiles = createSelector(
    [getRemoteFilesIds, getGlobalRemoteFiles],
    (remoteFilesIds: List<number>, remoteFiles: RemoteFileMapType) =>
      remoteFilesIds.map((remoteFileId: number) => remoteFiles.get(remoteFileId))
  );
  return {
    getRemotePath,
    getRemoteFilesIds,
    getRemoteFiles,
  };
};

export const getRemotePathSelectors = (remoteFileId: number): RemotePathSelectorsType => {
  if (!selectors.has(remoteFileId)) {
    selectors.set(remoteFileId, createSelectors(remoteFileId));
  }
  // $FlowFixMe
  return selectors.get(remoteFileId);
};