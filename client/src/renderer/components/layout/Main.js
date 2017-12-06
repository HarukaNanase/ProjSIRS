// @flow

import React from 'react';
import { Route, Switch, Redirect } from 'react-router-dom';
import Home from '../sections/Home';

class Main extends React.Component<any> {
  render() {
    return (
      <div>
        <Switch>
          <Route path="/home/:path*" component={Home}/>
          <Redirect to="/home/"/>
        </Switch>
      </div>
    );
  }
}

export default Main;