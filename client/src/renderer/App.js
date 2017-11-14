// @flow
import React from 'react';
import { Provider } from 'react-redux';
import { BrowserRouter, withRouter } from 'react-router-dom';
import type { Store } from 'redux';
import Main from './components/sections/Main';
import type { State } from './reducers';
import { isAuthenticated } from './selectors/user';
import Intro from './components/sections/Intro';

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
        <BrowserRouter>
          <Authentication store={this.props.store}/>
        </BrowserRouter>
      </Provider>
    );
  }
}

export default App;
