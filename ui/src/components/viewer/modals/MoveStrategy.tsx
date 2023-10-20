import Form from 'react-bootstrap/Form';


function MoveStrategy() {
  return <div>
    <Form.Label htmlFor="strategy">Move Strategy:</Form.Label>
    <Form.Select defaultValue={"append"}>
      <option value="append">Append</option>
      <option value="replace">Replace</option>
    </Form.Select>
  </div>;
}

export default MoveStrategy;
