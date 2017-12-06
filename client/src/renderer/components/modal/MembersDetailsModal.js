// @flow
import React from 'react';
import { Map, List } from 'immutable';
import { Button, Checkbox, Header, Modal, Table } from 'semantic-ui-react';
import { RemoteFile } from '../../types/remoteFile';

type PropsType = {
  onRevoke: (usernames: List<string>) => void,
  onClose: () => void,
  username: string,
  remoteFile?: RemoteFile,
};

type StateType = {
  usernamesSelected: Map<string, boolean>,
};

class MembersDetailsModal extends React.Component<PropsType, StateType> {
  props: PropsType;
  state: StateType;

  constructor(props: PropsType) {
    super(props);
    this.state = {
      usernamesSelected: Map(),
    };
  }

  onUsernameSelect = (username: string) => (event: Event, data: {checked: boolean}) => {
    let usernamesSelected;
    if (data.checked) {
      usernamesSelected = this.state.usernamesSelected.set(username, true);
    } else {
      usernamesSelected = this.state.usernamesSelected.remove(username);
    }
    this.setState({usernamesSelected});
  };

  onRevoke = () => {
    this.props.onRevoke(
      this.state.usernamesSelected.filter((value) => value).keySeq().toList());
  };

  render() {
    const {onClose, remoteFile, username} = this.props;
    const {usernamesSelected} = this.state;
    if (!remoteFile) {
      return <div/>;
    }
    const membersCount = remoteFile.membersUsernames.size + 1;
    const title = `${remoteFile.name} - ${membersCount} Members`;
    const isOwner = username === remoteFile.ownerUsername;

    const tableRows = remoteFile.sharedUsernames.map((user: string) =>
      <Table.Row key={user}>
        <Table.Cell>{user}</Table.Cell>
        {
          isOwner &&
            <Table.Cell>
              {
                user !== username ?
                  <Checkbox onChange={this.onUsernameSelect(user)} checked={usernamesSelected.has(user)}/>
                  :
                  <span>Unable</span>
              }
            </Table.Cell>
        }
      </Table.Row>
    );
    return (
      <Modal
        open
        onClose={onClose}
        size="small"
      >
        <Header icon="users" content={title}/>
        <Modal.Content>
          <Table basic="very">
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Username</Table.HeaderCell>
                {
                  isOwner &&
                    <Table.HeaderCell>Revoke</Table.HeaderCell>
                }
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {tableRows}
            </Table.Body>
          </Table>
        </Modal.Content>
        <Modal.Actions>
          {
            isOwner &&
            <Button primary onClick={this.onRevoke} disabled={!usernamesSelected.size}>
              Revoke
            </Button>
          }
          <Button onClick={onClose}>
            Cancel
          </Button>
        </Modal.Actions>
      </Modal>
    );
  }
}

export default MembersDetailsModal;