// @flow
import React from 'react';
import { Icon, Popup } from 'semantic-ui-react';

type PropsType = {
  needsReciphering: boolean;
  directory: boolean,
};

class RecipheringLabel extends React.Component<PropsType> {
  props: PropsType;

  render() {
    const {needsReciphering, directory} = this.props;
    if (!needsReciphering) return null;
    const content = directory ? 'Needs to be renamed' : 'Needs to be updated';
    return (
      <Popup
        content={content}
        trigger={<Icon name="warning sign" color="yellow" style={{fontSize: '1.25em'}}/>}
        position="top center"
        inverted
      />
    );
  }
}

export default RecipheringLabel;