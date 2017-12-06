// @flow
// Imports
import React from 'react';
import { Redirect, Route, Switch, withRouter } from 'react-router-dom';

import Login from '../dialogs/Login';
import Register from '../dialogs/Register';
import { Grid } from 'semantic-ui-react';

type PropsType = {
  location: any,
}

const Intro = withRouter((props: PropsType) => (
  <Grid centered columns={1} style={{height: '100vh'}}>
    <Grid.Column verticalAlign="middle">
      <Switch>
        <Route path="/login" component={Login}/>
        <Route path="/register" component={Register}/>
        <Redirect to={{pathname: '/login', state: {from: props.location}}}/>
      </Switch>
    </Grid.Column>
  </Grid>
));

export default Intro;
