// @flow
import React from 'react';
import { Button, Header, Modal } from 'semantic-ui-react';

type PropsType = {
  onDelete: () => void,
  onClose: () => void,
  show: boolean,
  selectedCount: number,
};

class DeleteModal extends React.Component<PropsType> {
  props: PropsType;

  render() {
    const {onDelete, onClose, show, selectedCount} = this.props;
    const title = `Delete ${selectedCount > 1 ? 'files' : 'file' }?`;
    const message =
      `Are you sure you want to delete ${selectedCount > 1 ? `these ${selectedCount} files` : 'this file'}?`;
    return (
      <Modal
        open={show}
        onClose={onClose}
        size="small"
      >
        <Header icon="trash" content={title}/>
        <Modal.Content>
          <p>{message}</p>
        </Modal.Content>
        <Modal.Actions>
          <Button primary onClick={onDelete}>
            Delete
          </Button>
          <Button onClick={onClose}>
            Cancel
          </Button>
        </Modal.Actions>
      </Modal>
    );
  }
}

export default DeleteModal;