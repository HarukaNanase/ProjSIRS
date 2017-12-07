// @flow
import React from 'react';
import { Provider } from 'react-redux';
import { HashRouter, withRouter } from 'react-router-dom';
import type { Store } from 'redux';
import Main from './components/layout/Main';
import type { State } from './reducers';
import { isAuthenticated } from './selectors/user';
import Intro from './components/layout/Intro';

type PropsType = {
  store: Store<State>
}

const Authentication = withRouter((props: PropsType) => {
  const authenticated: boolean = isAuthenticated(props.store.getState());
  return (authenticated ? <Main/> : <Intro/>);
});

class App extends React.Component<PropsType> {
  render() {
    return (
      <Provider store={this.props.store}>
        <HashRouter>
          <Authentication store={this.props.store}/>
        </HashRouter>
      </Provider>
    );
  }
}

export default App;
