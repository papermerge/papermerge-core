import Form from 'react-bootstrap/Form';
import { InsertAtType } from './types';
import { ChangeEvent } from 'react';


type Args = {
  onChange: (arg: InsertAtType) => void;
}

function InsertAt({onChange}: Args) {

  const onLocalChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value as InsertAtType;
    onChange(value);
  }

  return <div>
    <Form.Label htmlFor="strategy">Insert at:</Form.Label>
    <Form.Select defaultValue={"beginning"} onChange={onLocalChange}>
      <option value="beginning">Beginning</option>
      <option value="end">End</option>
    </Form.Select>
  </div>;
}

export default InsertAt;
