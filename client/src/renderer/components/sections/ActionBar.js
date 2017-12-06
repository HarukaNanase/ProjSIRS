// @flow
import { List, Map } from 'immutable';
import React from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { bindActionCreators } from 'redux';
import { Button, List as SemanticList } from 'semantic-ui-react';
import type { Dispatch } from '../../actions/index';
import {
  downloadRemoteFile,
  enterEditMode,
  enterNewDirectoryMode,
  deleteRemoteFile,
  editRemoteFile, revokeRemoteFile,
  shareRemoteFile,
  uploadRemoteFile
} from '../../actions/remoteFile';
import withElectron from '../../hoc/withElectron';
import type { State } from '../../reducers/index';
import { getSelectedCount, getSelectedIds, getSelectedRemoteFiles } from '../../selectors/remoteFile';
import { getCurrentRemoteFileId } from '../../selectors/remotePath';
import { RemoteFile } from '../../types/remoteFile';
import DeleteModal from '../modal/DeleteModal';
import ShareModal from '../modal/ShareModal';
import MembersDetailsModal from '../modal/MembersDetailsModal';
import { getUsername } from '../../selectors/user';

type PropsType = {
  actions: {
    enterEditMode: typeof enterEditMode,
    enterNewDirectoryMode: typeof enterNewDirectoryMode,
    deleteRemoteFile: typeof deleteRemoteFile,
    uploadRemoteFile: typeof uploadRemoteFile,
    editRemoteFile: typeof editRemoteFile,
    shareRemoteFile: typeof shareRemoteFile,
    revokeRemoteFile: typeof revokeRemoteFile,
    downloadRemoteFile: typeof downloadRemoteFile,
  },
  selectedIds: Map<number, boolean>,
  selectedFiles: List<RemoteFile>,
  currentRemoteFileId: number,
  selectedCount: number,
  username: string,
  electron: any,
};

type StateType = {
  showDeleteModal: boolean,
  showShareModal: boolean,
  showMemberDetailsModal: boolean,
};

class ActionBar extends React.Component<PropsType, StateType> {
  props: PropsType;

  constructor(props: PropsType) {
    super(props);
    this.state = {
      showDeleteModal: false,
      showShareModal: false,
      showMemberDetailsModal: false,
    };
  }

  onNewFolder = () => {
    this.props.actions.enterNewDirectoryMode();
  };

  onRename = () => {
    const remoteFileId = this.props.selectedIds.keySeq().first();
    if (!remoteFileId) return;
    this.props.actions.enterEditMode(remoteFileId);
  };

  onDownload = () => {
    const remoteFileId = this.props.selectedIds.keySeq().first();
    if (!remoteFileId) return;
    const filePath = this.props.electron.remote.dialog.showSaveDialog();
    if (filePath) {
      this.props.actions.downloadRemoteFile(remoteFileId, filePath);
    }
  };

  onUpload = () => {
    const filePaths = this.props.electron.remote.dialog.showOpenDialog({
      properties: ['openFile']
    });
    if (filePaths && filePaths.length === 1) {
      this.props.actions.uploadRemoteFile(this.props.currentRemoteFileId, filePaths[0]);
    }
  };

  onEdit = () => {
    const {electron, selectedIds, actions} = this.props;
    const remoteFileId = selectedIds.keySeq().first();
    if (!remoteFileId) return;
    const filePaths = electron.remote.dialog.showOpenDialog({
      properties: ['openFile']
    });
    if (filePaths) {
      actions.editRemoteFile(remoteFileId, filePaths[0]);
    }
  };

  openDeleteModal = () => {
    this.setState({showDeleteModal: true});
  };

  closeDeleteModal = () => {
    this.setState({showDeleteModal: false});
  };

  onDelete = () => {
    const remoteFilesIds = this.props.selectedIds.keySeq().toList();
    if (!remoteFilesIds) return;
    this.props.actions.deleteRemoteFile(this.props.currentRemoteFileId, remoteFilesIds);
    this.closeDeleteModal();
  };

  openShareModal = () => {
    this.setState({showShareModal: true});
  };

  closeShareModal = () => {
    this.setState({showShareModal: false});
  };

  onShare = (usernames: List<string>) => {
    const remoteFileId = this.props.selectedIds.keySeq().first();
    if (!remoteFileId) return;
    this.props.actions.shareRemoteFile(remoteFileId, usernames);
    this.closeShareModal();
  };

  openMemberDetailsModal = () => {
    this.setState({showMemberDetailsModal: true});
  };

  closeMemberDetailsModal = () => {
    this.setState({showMemberDetailsModal: false});
  };

  onRevoke = (usernames: List<string>) => {
    const remoteFileId = this.props.selectedIds.keySeq().first();
    if (!remoteFileId) return;
    this.props.actions.revokeRemoteFile(remoteFileId, usernames);
    this.closeMemberDetailsModal();
  };

  render() {
    const {selectedCount, selectedFiles, username} = this.props;
    const firstSelectedRemoteFile = selectedFiles.first();
    return (
      <div className="ActionBar">
        {
          selectedCount === 0 &&
          <Button fluid primary onClick={this.onUpload}>
            Upload files
          </Button>
        }
        {
          selectedCount === 1 &&
          <Button fluid primary onClick={this.openShareModal}>
            Share
          </Button>
        }
        {
          selectedCount > 1 &&
          <Button fluid primary onClick={this.openDeleteModal}>
            Delete
          </Button>
        }
        <SemanticList relaxed>
          {
            selectedCount === 0 &&
            <SemanticList.Item>
              <SemanticList.Icon name="folder outline" size="large" verticalAlign="middle"/>
              <SemanticList.Content>
                <SemanticList.Header as="a" onClick={this.onNewFolder}>New folder</SemanticList.Header>
              </SemanticList.Content>
            </SemanticList.Item>
          }
          {
            (selectedCount === 1 && firstSelectedRemoteFile && !firstSelectedRemoteFile.directory) &&
            <SemanticList.Item>
              <SemanticList.Icon name="download" size="large" verticalAlign="middle"/>
              <SemanticList.Content>
                <SemanticList.Header as="a" onClick={this.onDownload}>Download</SemanticList.Header>
              </SemanticList.Content>
            </SemanticList.Item>
          }
          {
            selectedCount === 1 &&
            <SemanticList.Item>
              <SemanticList.Icon name="users" size="large" verticalAlign="middle"/>
              <SemanticList.Content>
                <SemanticList.Header as="a" onClick={this.openMemberDetailsModal}>Members</SemanticList.Header>
              </SemanticList.Content>
            </SemanticList.Item>
          }
          {
            (selectedCount === 1 && firstSelectedRemoteFile && !firstSelectedRemoteFile.directory) &&
            <SemanticList.Item>
              <SemanticList.Icon name='pencil' size='large' verticalAlign='middle'/>
              <SemanticList.Content>
                <SemanticList.Header as='a' onClick={this.onEdit}>Edit</SemanticList.Header>
              </SemanticList.Content>
            </SemanticList.Item>
          }
          {
            selectedCount === 1 &&
            <SemanticList.Item>
              <SemanticList.Icon name="text cursor" size="large" verticalAlign="middle"/>
              <SemanticList.Content>
                <SemanticList.Header as="a" onClick={this.onRename}>Rename</SemanticList.Header>
              </SemanticList.Content>
            </SemanticList.Item>
          }
          {
            selectedCount === 1 &&
            <SemanticList.Item>
              <SemanticList.Icon name="trash" size="large" verticalAlign="middle"/>
              <SemanticList.Content>
                <SemanticList.Header as="a" onClick={this.openDeleteModal}>Delete</SemanticList.Header>
              </SemanticList.Content>
            </SemanticList.Item>
          }
        </SemanticList>

        {/* Modals */}
        <DeleteModal
          show={this.state.showDeleteModal}
          onClose={this.closeDeleteModal}
          onDelete={this.onDelete}
          selectedCount={selectedCount}
        />
        <ShareModal
          remoteFile={this.state.showShareModal ? firstSelectedRemoteFile : undefined}
          onClose={this.closeShareModal}
          onShare={this.onShare}
        />
        <MembersDetailsModal
          remoteFile={this.state.showMemberDetailsModal ? firstSelectedRemoteFile : undefined}
          username={username}
          onClose={this.closeMemberDetailsModal}
          onRevoke={this.onRevoke}
        />
      </div>
    );
  }
}

const mapStateToProps = (state: State, props: PropsType) => ({
  selectedIds: getSelectedIds(state),
  username: getUsername(state),
  currentRemoteFileId: getCurrentRemoteFileId(state, props),
  selectedCount: getSelectedCount(state),
  selectedFiles: getSelectedRemoteFiles(state),
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
  actions: bindActionCreators({
    enterEditMode,
    enterNewDirectoryMode,
    deleteRemoteFile,
    uploadRemoteFile,
    editRemoteFile,
    shareRemoteFile,
    downloadRemoteFile,
    revokeRemoteFile,
  }, dispatch)
});


export default withElectron(withRouter(connect(mapStateToProps, mapDispatchToProps)(ActionBar)));
