// @flow
import React from 'react';
import { Button, Form, Input } from 'semantic-ui-react';

type PropsType = {
  name: string,
  editable: boolean,
  needsReciphering: boolean,
  onNameChange: (name: string) => void,
  onCancel: () => void,
};

type StateType = {
  newName: string,
};

class NameCell extends React.Component<PropsType, StateType> {
  props: PropsType;
  state: StateType;
  inputRef: any;

  static defaultProps = {
    editable: false,
  };

  constructor(props: PropsType) {
    super(props);
    this.state = {
      newName: props.name,
    };
  }

  handleInputRef = (input: any) => {
    this.inputRef = input;
    if (this.inputRef) {
      this.inputRef.focus();
      this.inputRef.inputRef.select();
    }
  };

  onSubmit = () => {
    this.props.onNameChange(this.state.newName);
  };

  onCancel = () => {
    this.props.onCancel();
  };

  onKeyDown = (event: Event,) => {
    // If ESC is pressed cancel.
    if (event.keyCode === 27) {
      this.props.onCancel();
    }
  };

  onNameChange = (event: Event, data: { value: string }) => {
    this.setState({
      newName: data.value,
    });
  };

  render() {
    if (!this.props.editable) {
      return this.props.name;
    }
    // Folder or file icon = 50px width; Reciphering warning label = 50px width;
    const width = this.props.needsReciphering ? 100 : 50;
    return (
      <Form onSubmit={this.onSubmit} style={{display: 'inline-block', width: `calc(100% - ${width}px)`}}>
        <Input
          style={{width: 'calc(100% - 80px)'}}
          type="text"
          onChange={this.onNameChange}
          onKeyDown={this.onKeyDown}
          value={this.state.newName}
          ref={this.handleInputRef}
        />
        <Button attached="right" icon="close" onClick={this.onCancel}/>
        <Button attached="right" primary icon="checkmark" onClick={this.onSubmit}/>
      </Form>
    );
  }

}

export default NameCell;