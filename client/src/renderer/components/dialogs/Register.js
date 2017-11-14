// @flow

import { List } from 'immutable';
import React from 'react';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';
import { bindActionCreators } from 'redux';
import { Button, Form, Grid, Header, Input, Message, Segment } from 'semantic-ui-react';
import type { Dispatch } from '../../actions/index';
import {
  register,
  setConfirmPassword,
  setCustomSecret,
  setErrors,
  setPassword,
  setUsername
} from '../../actions/ui/register/register';
import type { State } from '../../reducers/index';
import {
  getConfirmPassword,
  getCustomSecret,
  getErrors,
  getPassword,
  getUsername,
  isSubmitting
} from '../../selectors/ui/register/register';

type PropsType = {
  actions: {
    setUsername: typeof setUsername,
    setPassword: typeof setPassword,
    setConfirmationPassword: typeof setConfirmPassword,
    setCustomSecret: typeof setCustomSecret,
    setErrors: typeof setErrors,
    register: typeof register,
  },
  username: string,
  password: string,
  confirmPassword: string,
  customSecret: string,
  errors: List<string>,
  isSubmitting: string,
  history: any,
};

class Register extends React.Component<PropsType> {
  props: PropsType;

  onUsernameChange = (event: any, field: { value: string }) => this.props.actions.setUsername(field.value);

  onPasswordChange = (event: any, field: { value: string }) => this.props.actions.setPassword(field.value);

  onConfirmPasswordChange = (event: any, field: { value: string }) => this.props.actions.setConfirmationPassword(field.value);

  onCustomSecretChange = (event: any, field: { value: string }) => this.props.actions.setCustomSecret(field.value);

  onSubmit = () => {
    const {actions: {register}, history} = this.props;
    register(history);
  };

  render() {
    const {
      username, password, confirmPassword,
      customSecret, errors, isSubmitting
    } = this.props;
    return (
      <Grid centered verticalAlign="middle">
        <Grid.Row>
          <Grid.Column textAlign="center">
            <Header size="large">Register</Header>
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
                  <label>Username</label>
                  <Input
                    fluid
                    icon="user"
                    iconPosition="left"
                    placeholder="Username"
                    value={username}
                    onChange={this.onUsernameChange}
                  />
                </Form.Field>
                <Form.Group widths="equal">
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
                    <label>Confirm password:</label>
                    <Input
                      fluid
                      icon="lock"
                      iconPosition="left"
                      placeholder="Confirm password"
                      type="password"
                      value={confirmPassword}
                      onChange={this.onConfirmPasswordChange}
                    />
                  </Form.Field>
                </Form.Group>
                <Form.Field>
                  <label>Custom secret (optional):</label>
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
                <Button fluid size="large">Register</Button>
              </Segment>
              <Message style={{textAlign: 'center'}}>
                <span>Already have an account? </span>
                <Link to={{pathname: '/login'}}>Login</Link>
              </Message>
            </Form>
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
    confirmPassword: getConfirmPassword(state),
    customSecret: getCustomSecret(state),
    errors: getErrors(state),
    isSubmitting: isSubmitting(state),
  };
};

const mapDispatchToProps = (dispatch: Dispatch) => ({
  actions: bindActionCreators({
    setUsername,
    setPassword,
    setConfirmationPassword: setConfirmPassword,
    setCustomSecret,
    setErrors,
    register,
  }, dispatch)
});

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(Register));