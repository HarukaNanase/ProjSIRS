// @flow
import React from 'react';
import { Link } from 'react-router-dom';
import { Icon, Table } from 'semantic-ui-react';
import { RemoteFile } from '../../types/remoteFile';
import NameCell from './NameCell';
import Popup from 'semantic-ui-react/dist/es/modules/Popup/Popup';

type PropsType = {
  remoteFile: RemoteFile,
  currentRemoteFilesIdsJoinedPath: string,
  editable: boolean,
  onNameChange: (newName: string) => void,
  onCancel: () => void,
}

class RemoteFileCell extends React.Component<PropsType> {

  static defaultProps = {
    editable: false
  };

  render() {
    const {remoteFile, onNameChange, onCancel, editable, currentRemoteFilesIdsJoinedPath} = this.props;
    const nameCell = (
      <NameCell
        name={remoteFile.name}
        onNameChange={onNameChange}
        onCancel={onCancel}
        editable={editable}
      />
    );
    if (!remoteFile.directory) {
      return (
        <Table.Cell>
          <Icon name="file outline"/>
          {
            remoteFile.needsRecipher &&
            <Popup
              trigger={<Icon name="warning" color="red"/>}
              content="File needs to updated!"
              inverted
            />
          }
          {nameCell}
        </Table.Cell>
      );
    }
    return (
      editable ?
        <Table.Cell>
          <Icon name="folder outline"/>
          {
            remoteFile.needsRecipher &&
            <Popup
              trigger={<Icon name="warning" color="red"/>}
              content="Folder needs to be renamed!"
              inverted
            />
          }
          {nameCell}
        </Table.Cell>
        :
        <Table.Cell>
          <Link to={`${currentRemoteFilesIdsJoinedPath}/${remoteFile.id}`} as="a">
            <Icon name="folder outline"/>
            {
              remoteFile.needsRecipher &&
              <Popup
                trigger={<Icon name="warning" color="red"/>}
                content="Folder needs to be renamed!"
                inverted
              />
            }
            {nameCell}
          </Link>
        </Table.Cell>
    );
  }
}

export default RemoteFileCell;