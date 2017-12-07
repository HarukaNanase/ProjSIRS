// @flow
import React from 'react';
import { Button, Popup } from 'semantic-ui-react';

type PropsType = {
  isOwner: boolean,
};

class ShareButton extends React.Component<PropsType> {
  props: PropsType;

  render() {
    const {isOwner, ...restProps} = this.props;
    if (isOwner) {
      return <Button {...restProps}>Share</Button>;
    }
    return (
      <Popup
        trigger={<div><Button {...restProps} disabled>Share</Button></div>}
        content="You need to be owner of the file to share it"
        inverted
        position="top left"
      />
    );
  }
}

export default ShareButton;