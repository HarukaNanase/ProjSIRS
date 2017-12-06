// @flow
import React from 'react';
import { withRouter } from 'react-router-dom';
import Header from '../layout/Header';
import FileTable from '../table/FileTable';
import ActionBar from './ActionBar';
import Progress from 'semantic-ui-react/dist/es/modules/Progress/Progress';

class Home extends React.Component<any> {

  render() {
    return (
      <div height="100vh">
        <Header/>
        <section className="Content">
          <div className="main-content">
            <FileTable/>
          </div>
          <div className="secondary-content">
            <ActionBar/>
          </div>
        </section>
      </div>
    );
  }
}

export default withRouter(Home);