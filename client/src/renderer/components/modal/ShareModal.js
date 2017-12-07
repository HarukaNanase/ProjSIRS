// @flow
import { List } from 'immutable';
import React from 'react';
import { Button, Dropdown, Header, Modal } from 'semantic-ui-react';
import { RemoteFile } from '../../types/remoteFile';

type PropsType = {
  onShare: (usernames: List<string>) => void,
  onClose: () => void,
  remoteFile?: RemoteFile,
};

type StateType = {
  usernamesOptions: List<{ text: string, value: string }>,
  selectedUsers: List<string>,
};

class ShareModal extends React.Component<PropsType, StateType> {
  props: PropsType;
  state: StateType;

  constructor(props: PropsType) {
    super(props);
    this.state = {
      usernamesOptions: List(),
      selectedUsers: List(),
    };
  }

  onAddUsername = (event: Event, data: { value: string }) => {
    this.setState({
      usernamesOptions: this.state.usernamesOptions.push({text: data.value, value: data.value}),
    });
  };

  onChange = (event: Event, data: {value: Array<string>}) => {
    this.setState({
      selectedUsers: List(data.value)
    })
  };

  onShare = () => {
    this.props.onShare(this.state.selectedUsers);
  };

  onClose = () => {
    this.props.onClose();
    // Reset the state.
    this.setState({
      usernamesOptions: List(),
      selectedUsers: List(),
    });
  };

  render() {
    const {remoteFile} = this.props;
    if (!remoteFile) {
      return null;
    }
    const icon = remoteFile.directory ? 'folder' : 'file';
    return (
      <Modal
        open
        onClose={this.onClose}
        size="small"
      >
        <Header icon={icon} content={remoteFile.name}/>
        <Modal.Content>
          <Header as="h5">Share with:</Header>
          <Dropdown
            options={this.state.usernamesOptions.toJS()}
            additionLabel="Share with: "
            noResultsMessage="Type a name"
            placeholder="Username"
            search
            selection
            fluid
            multiple
            allowAdditions
            onAddItem={this.onAddUsername}
            onChange={this.onChange}
          />
        </Modal.Content>
        <Modal.Actions>
          <Button onClick={this.onClose}>
            Cancel
          </Button>
          <Button primary onClick={this.onShare} disabled={!this.state.selectedUsers.size}>
            Share
          </Button>
        </Modal.Actions>
      </Modal>
    );
  }
}

export default ShareModal;