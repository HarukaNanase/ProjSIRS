// @flow
import React from 'react';
import { Map, List } from 'immutable';
import { Button, Checkbox, Header, Icon, Modal, Popup, Table } from 'semantic-ui-react';
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
    const {onClose, remoteFile} = this.props;
    if (!remoteFile) {
      return null;
    }
    const {usernamesSelected} = this.state;
    const membersCount = remoteFile.allMembers.size;
    const title = `${remoteFile.name} - ${membersCount} members`;
    const isOwner = (this.props.username === remoteFile.ownerUsername);
    const tableRows = remoteFile.allMembers.map((username: string) =>
      <Table.Row key={username}>
        <Table.Cell>
          {username}
          {
            username === remoteFile.ownerUsername &&
              <Popup trigger={<Icon name="star" />} content="Owner" position="right center" inverted/>
          }
          </Table.Cell>
        {
          isOwner &&
            <Table.Cell>
              {
                this.props.username !== username ?
                  <Checkbox onChange={this.onUsernameSelect(username)} checked={usernamesSelected.has(username)}/>
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