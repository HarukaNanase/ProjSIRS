// @flow
import React from 'react';
import { withRouter } from 'react-router-dom';
import { Dropdown, Image } from 'semantic-ui-react';
import Navigation from '../sections/Navigation';
import { deauthenticate } from '../../actions/user';
import { connect } from 'react-redux';
import type { State } from '../../reducers/index';
import type { Dispatch } from '../../actions/index';
import { bindActionCreators } from 'redux';
import { getUsername } from '../../selectors/user';

type PropsType = {
  actions: {
    deauthenticate: typeof deauthenticate,
  },
  username: string,
  history: any,
};

class Header extends React.Component<any> {

  onLogout = () => {
    this.props.actions.deauthenticate(this.props.history);
  };

  render() {
    const user = (
      <div className="user">
        <span>{this.props.username}</span>
        <Image src="https://avatars2.githubusercontent.com/u/3120671?s=460&v=4" avatar/>
      </div>
    );

    return (
      <header className="Header">
        <Navigation/>
        <Dropdown trigger={user} pointing='top right' icon={null}>
          <Dropdown.Menu>
            <Dropdown.Item icon='log out' text='Log out' onClick={this.onLogout}/>
          </Dropdown.Menu>
        </Dropdown>
      </header>
    );
  }
}

const mapStateToProps = (state: State, props: PropsType) => ({
  username: getUsername(state)
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
  actions: bindActionCreators({
    deauthenticate,
  }, dispatch)
});

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(Header));
