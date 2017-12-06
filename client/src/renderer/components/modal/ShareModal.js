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
};

class ShareModal extends React.Component<PropsType, StateType> {
  props: PropsType;
  state: StateType;

  constructor(props: PropsType) {
    super(props);
    this.state = {
      usernamesOptions: List(),
    };
  }

  onAddUsername = (event: Event, data: { value: string }) => {
    this.setState({
      usernamesOptions: this.state.usernamesOptions.push({text: data.value, value: data.value}),
    });
  };

  onShare = () => {
    const usernames = this.state.usernamesOptions.map((option: any) => option.value);
    this.props.onShare(usernames);
  };

  render() {
    const {onClose, remoteFile} = this.props;
    if (!remoteFile) {
      return null;
    }
    const icon = remoteFile.directory ? 'folder' : 'file';
    return (
      <Modal
        open
        onClose={onClose}
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
          />
        </Modal.Content>
        <Modal.Actions>
          <Button onClick={onClose}>
            Cancel
          </Button>
          <Button primary onClick={this.onShare}>
            Share
          </Button>
        </Modal.Actions>
      </Modal>
    );
  }
}

export default ShareModal;