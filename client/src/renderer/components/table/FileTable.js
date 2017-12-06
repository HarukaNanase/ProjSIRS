// @flow
import { List, Map } from 'immutable';
import React from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { bindActionCreators } from 'redux';
import { Checkbox, Table } from 'semantic-ui-react';
import type { Dispatch } from '../../actions/index';
import {
  clearSelectedRemoteFiles,
  exitEditMode,
  exitNewDirectoryMode,
  newRemoteDirectory,
  renameRemoteFile,
  selectRemoteFile
} from '../../actions/remoteFile';
import { loadRemotePath } from '../../actions/remotePath';
import { NEW_DIRECTORY_ID } from '../../constants/remoteFile';
import withElectron from '../../hoc/withElectron';
import type { State } from '../../reducers/index';
import {
  getEditId,
  getInEditMode,
  getInNewDirectoryMode,
  getNewDirectory,
  getSelectedIds
} from '../../selectors/remoteFile';
import {
  getCurrentRemoteFileId,
  getCurrentRemoteFilesIdsJoinedPath,
  getLoadingRemotePath,
  getRemotePathSelectors
} from '../../selectors/remotePath';
import { RemoteFile } from '../../types/remoteFile';
import LoadingTable from './LoadingTable';
import RemoteFileCell from './RemoteFileCell';

type PropsType = {
  actions: {
    loadRemotePath: typeof loadRemotePath,
    selectRemoteFile: typeof selectRemoteFile,
    exitEditMode: typeof exitEditMode,
    exitNewDirectoryMode: typeof exitNewDirectoryMode,
    clearSelectedRemoteFiles: typeof clearSelectedRemoteFiles,
    renameRemoteFile: typeof renameRemoteFile,
    newRemoteDirectory: typeof newRemoteDirectory,
  },
  currentRemoteFileId: number,
  currentRemoteFilesIdsJoinedPath: string,
  files: List<RemoteFile>,
  selectedIds: Map<number, boolean>,
  editId: number,
  newDirectory: RemoteFile,
  inEditMode: boolean,
  inNewDirectoryMode: boolean,
  loadingRemotePath: boolean,
  history: any,
  match: any,
  electron: any,
};

class FileTable extends React.Component<PropsType> {
  props: PropsType;

  componentWillMount() {
    this.props.actions.loadRemotePath(this.props.currentRemoteFileId);
  }

  componentWillReceiveProps(nextProps: PropsType) {
    // If the path changes
    //  - Load the new path
    //  - Clear the selected items
    //  - Remove edit mode
    if (nextProps.currentRemoteFileId !== this.props.currentRemoteFileId) {
      this.props.actions.loadRemotePath(nextProps.currentRemoteFileId);
      this.props.actions.clearSelectedRemoteFiles();
      this.props.actions.exitEditMode();
    }
  }

  onRemoteFileSelect = (remoteFileId: number) => (event: Event, data: { checked: boolean }) => {
    this.props.actions.selectRemoteFile(remoteFileId, data.checked);
  };

  onNameSave = (remoteFileId: number) => (newName: string) => {
    const {inNewDirectoryMode, currentRemoteFileId, electron, actions} = this.props;
    if (newName.length === 0) {
      electron.remote.dialog.showErrorBox('Invalid name', 'Name can\'t be empty!');
      return;
    }
    // We just renamed a new directory, therefore create a new folder if the name is not empty.
    if (inNewDirectoryMode && remoteFileId === NEW_DIRECTORY_ID) {
      actions.newRemoteDirectory(currentRemoteFileId, newName);
      actions.exitNewDirectoryMode();
    } else {
      actions.renameRemoteFile(remoteFileId, newName);
    }
  };

  onNameCancel = (remoteFileId: number) => () => {
    const {actions, inNewDirectoryMode} = this.props;
    actions.exitEditMode();
    // If we were creating a new directory and we cancelled, exit new directory mode.
    if (inNewDirectoryMode && remoteFileId === NEW_DIRECTORY_ID) {
      actions.exitNewDirectoryMode();
    }
  };

  renderFileRow = (remoteFile: RemoteFile) => {
    const {selectedIds, editId, inEditMode, currentRemoteFilesIdsJoinedPath} = this.props;
    const membersCount = remoteFile.allMembers.size;
    const members = membersCount === 1 ? 'Only you' : `${membersCount} members`;
    return (
      <Table.Row
        key={remoteFile.id}
      >
        <Table.Cell>
          <Checkbox
            disabled={inEditMode}
            checked={selectedIds.has(remoteFile.id)}
            onChange={this.onRemoteFileSelect(remoteFile.id)}
          />
        </Table.Cell>
        <RemoteFileCell
          remoteFile={remoteFile}
          currentRemoteFilesIdsJoinedPath={currentRemoteFilesIdsJoinedPath}
          onNameChange={this.onNameSave(remoteFile.id)}
          onCancel={this.onNameCancel(remoteFile.id)}
          editable={inEditMode && editId === remoteFile.id}
        />
        <Table.Cell>{remoteFile.modified.toDateString()}</Table.Cell>
        <Table.Cell>
          {members}
        </Table.Cell>
      </Table.Row>
    );
  };

  render() {
    const {
      loadingRemotePath, newDirectory, inNewDirectoryMode
    } = this.props;
    // If we are loading files, don't render the table.
    if (loadingRemotePath) {
      return (
        <div className="FileTable"><LoadingTable/></div>
      );
    }

    // Else render the table.
    const files = this.props.files.map((remoteFile: RemoteFile) => {
      return this.renderFileRow(remoteFile);
    });

    return (
      <div className="FileTable">
        <Table unstackable>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell/>
              <Table.HeaderCell width="nine">Name</Table.HeaderCell>
              <Table.HeaderCell>Modified</Table.HeaderCell>
              <Table.HeaderCell>Members</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {
              inNewDirectoryMode &&
              this.renderFileRow(newDirectory)
            }
            {files}
          </Table.Body>
          {
            !inNewDirectoryMode && files.size === 0 &&
            <Table.Footer>
              <Table.Row>
                <Table.Cell colSpan="4" textAlign="center">
                  You don't have any files
                </Table.Cell>
              </Table.Row>
            </Table.Footer>
          }
        </Table>
      </div>
    );
  }
}

const mapStateToProps = (state: State, props: PropsType) => {
  const currentRemoteFileId = getCurrentRemoteFileId(state, props);
  const {getRemoteFiles} = getRemotePathSelectors(currentRemoteFileId);
  return {
    currentRemoteFileId,
    currentRemoteFilesIdsJoinedPath: getCurrentRemoteFilesIdsJoinedPath(state, props),
    files: getRemoteFiles(state),
    loadingRemotePath: getLoadingRemotePath(state),
    editId: getEditId(state),
    newDirectory: getNewDirectory(state),
    inEditMode: getInEditMode(state),
    inNewDirectoryMode: getInNewDirectoryMode(state),
    selectedIds: getSelectedIds(state)
  };
};

const mapDispatchToProps = (dispatch: Dispatch) => ({
  actions: bindActionCreators({
    loadRemotePath,
    selectRemoteFile,
    exitEditMode,
    exitNewDirectoryMode,
    clearSelectedRemoteFiles,
    renameRemoteFile,
    newRemoteDirectory,
  }, dispatch)
});

export default withElectron(withRouter(connect(mapStateToProps, mapDispatchToProps)(FileTable)));