import Form from 'react-bootstrap/Form';


function InsertAt() {
  return <div>
    <Form.Label htmlFor="strategy">Insert at:</Form.Label>
    <Form.Select defaultValue={"beginning"}>
      <option value="beginning">Beginning</option>
      <option value="end">Replace</option>
    </Form.Select>
  </div>;
}

export default InsertAt;
