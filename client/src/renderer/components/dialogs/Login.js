// @flow
import { List } from 'immutable';
import React from 'react';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';
import { bindActionCreators } from 'redux';
import { Button, Form, Grid, Header, Input, Message, Segment } from 'semantic-ui-react';
import type { Dispatch } from '../../actions/index';
import { login, setCustomSecret, setErrors, setPassword, setUsername } from '../../actions/ui/login/login';
import type { State } from '../../reducers/index';
import { getCustomSecret, getErrors, getPassword, getUsername, isSubmitting } from '../../selectors/ui/login/login';

type PropsType = {
  actions: {
    setUsername: typeof setUsername,
    setPassword: typeof setPassword,
    setCustomSecret: typeof setCustomSecret,
    setErrors: typeof setErrors,
    login: typeof login,
  },
  username: string,
  password: string,
  customSecret: string,
  errors: List<string>,
  isSubmitting: boolean,
  history: any,
};

class Login extends React.Component<PropsType> {
  props: PropsType;

  onUsernameChange = (event: any, field: { value: string }) => this.props.actions.setUsername(field.value);

  onPasswordChange = (event: any, field: { value: string }) => this.props.actions.setPassword(field.value);

  onCustomSecretChange = (event: any, field: { value: string }) => this.props.actions.setCustomSecret(field.value);

  onSubmit = () => {
    const {actions: {login}, history} = this.props;
    login(history);
  };

  render() {
    const {username, password, customSecret, errors, isSubmitting} = this.props;

    return (
      <Grid centered verticalAlign="middle">
        <Grid.Row>
          <Grid.Column textAlign="center">
            <Header size="large">Login</Header>
          </Grid.Column>
        </Grid.Row>
        <Grid.Row>
          <Grid.Column width={10}>
            {
              errors.size !== 0 &&
              <Message error list={errors.toJS()}/>
            }
            <Form onSubmit={this.onSubmit}>
              <Segment loading={isSubmitting}>
                <Form.Field>
                  <label>Username:</label>
                  <Input
                    fluid
                    icon="user"
                    iconPosition="left"
                    placeholder="Username"
                    value={username}
                    onChange={this.onUsernameChange}
                  />
                </Form.Field>
                <Form.Field>
                  <label>Password:</label>
                  <Input
                    fluid
                    icon="lock"
                    iconPosition="left"
                    placeholder="Password"
                    type="password"
                    value={password}
                    onChange={this.onPasswordChange}
                  />
                </Form.Field>
                <Form.Field>
                  <label>Custom secret (if you have):</label>
                  <Input
                    fluid
                    icon="key"
                    iconPosition="left"
                    placeholder="Custom secret"
                    type="password"
                    value={customSecret}
                    onChange={this.onCustomSecretChange}
                  />
                </Form.Field>
                <Button fluid size="large">Login</Button>
              </Segment>
            </Form>
            <Message style={{textAlign: 'center'}}>
              <span>Don't have an account yet? </span>
              <Link to={{pathname: '/register'}}>Register</Link>
            </Message>
          </Grid.Column>
        </Grid.Row>
      </Grid>
    );
  }
}

const mapStateToProps = (state: State) => {
  return {
    username: getUsername(state),
    password: getPassword(state),
    customSecret: getCustomSecret(state),
    errors: getErrors(state),
    isSubmitting: isSubmitting(state),
  };
};

const mapDispatchToProps = (dispatch: Dispatch) => ({
  actions: bindActionCreators({
    setUsername,
    setPassword,
    setCustomSecret,
    setErrors,
    login,
  }, dispatch)
});

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(Login));