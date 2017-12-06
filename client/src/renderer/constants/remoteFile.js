// @flow
export const ROOT_ID = -1;
export const NEW_DIRECTORY_ID = -42;

export const isRootDirectory= (remoteFileId: number) => remoteFileId === ROOT_ID;