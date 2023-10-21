import Form from 'react-bootstrap/Form';
import { MoveStrategyType } from './types';
import { ChangeEvent } from 'react';


type Args = {
  onChange: (arg: MoveStrategyType) => void;
}

function MoveStrategy({onChange}: Args) {

  const onLocalChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value as MoveStrategyType;
    onChange(value);
  }

  return <div>
    <Form.Label htmlFor="strategy">Move Strategy:</Form.Label>
    <Form.Select defaultValue={"append"} onChange={onLocalChange}>
      <option value="append">Append</option>
      <option value="replace">Replace</option>
    </Form.Select>
  </div>;
}

export default MoveStrategy;
