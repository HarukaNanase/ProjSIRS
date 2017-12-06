// @flow
import { List } from 'immutable';
import React from 'react';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';
import { Breadcrumb } from 'semantic-ui-react';
import { isRootDirectory } from '../../constants/remoteFile';
import type { State } from '../../reducers/index';
import { getCurrentRemoteFilesIdsPath, getCurrentRemoteFilesNamesPath } from '../../selectors/remotePath';

type PropsType = {
  currentRemoteFilesIdsPath: List<number>,
  currentRemoteFilesNamesPath: List<string>,
}

class Navigation extends React.Component<PropsType> {

  render() {
    const {currentRemoteFilesIdsPath, currentRemoteFilesNamesPath} = this.props;
    let link = '/home';
    const breadcrumb = currentRemoteFilesIdsPath.map((remoteFileId, index) => {
      // If it is not the root file id add the id to the path.
      if (!isRootDirectory(remoteFileId))
        link += '/' + remoteFileId;
      // If it is the last segment, don't render it as a link nor a divider.
      if (index === currentRemoteFilesIdsPath.size - 1) {
        return <Breadcrumb.Section key={link}>{currentRemoteFilesNamesPath.get(index)}</Breadcrumb.Section>;
      } else {
        // Else render the link and the divider.
        return [
          <Breadcrumb.Section key={link} to={link} as={Link}>
            {currentRemoteFilesNamesPath.get(index)}
          </Breadcrumb.Section>,
          <Breadcrumb.Divider key={`${link}divider`}/>
        ];
      }
    });
    return (
      <div className="Navigation">
        <Breadcrumb size="huge">
          {breadcrumb}
        </Breadcrumb>
      </div>
    );
  }
}

const mapStateToProps = (state: State, props: any) => ({
  currentRemoteFilesIdsPath: getCurrentRemoteFilesIdsPath(state, props),
  currentRemoteFilesNamesPath: getCurrentRemoteFilesNamesPath(state, props),
});


export default withRouter(connect(mapStateToProps)(Navigation));
