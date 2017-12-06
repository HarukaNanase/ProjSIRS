// @flow
import React from 'react';
import { Checkbox, Icon, Segment, Table } from 'semantic-ui-react';

type PropsType = {
  rows: number;
}

class LoadingTable extends React.Component<any> {
  props:PropsType;

  static defaultProps = {
    rows: 5,
  };

  render() {
    const placeholderRows = [];
    for (let i = 0; i < this.props.rows; i++) {
      placeholderRows.push((
        <Table.Row key={i}>
          <Table.Cell><Checkbox disabled/></Table.Cell>
          <Table.Cell><Icon name="folder"/></Table.Cell>
          <Table.Cell/>
          <Table.Cell/>
        </Table.Row>
      ));
    }
    return (
      <Segment style={{padding: 0, border: 'none', boxShadow: 'none'}} loading>
        <Table unstackable>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell><Checkbox/></Table.HeaderCell>
              <Table.HeaderCell>Name</Table.HeaderCell>
              <Table.HeaderCell>Modified</Table.HeaderCell>
              <Table.HeaderCell>Members</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {placeholderRows}
          </Table.Body>
        </Table>
      </Segment>
    );
  }
}

export default LoadingTable;