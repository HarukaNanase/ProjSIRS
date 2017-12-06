// @flow
import React from 'react';
import { Link } from 'react-router-dom';
import { Icon, Table } from 'semantic-ui-react';
import { RemoteFile } from '../../types/remoteFile';
import RecipheringLabel from '../labels/RecipheringLabel';
import NameCell from './NameCell';

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
        needsReciphering={remoteFile.needsReciphering}
      />
    );
    if (!remoteFile.directory) {
      return (
        <Table.Cell>
          <Icon name="file outline"/>
          <RecipheringLabel needsReciphering={remoteFile.needsReciphering} directory={false}/>
          {nameCell}
        </Table.Cell>
      );
    }
    return (
      editable ?
        <Table.Cell>
          <Icon name="folder outline"/>
          <RecipheringLabel needsReciphering={remoteFile.needsReciphering} directory/>
          {nameCell}
        </Table.Cell>
        :
        <Table.Cell>
          <Link to={`${currentRemoteFilesIdsJoinedPath}/${remoteFile.id}`} as="a">
            <Icon name="folder outline"/>
            <RecipheringLabel needsReciphering={remoteFile.needsReciphering} directory/>
            {nameCell}
          </Link>
        </Table.Cell>
    );
  }
}

export default RemoteFileCell;