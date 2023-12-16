import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';

type Args = {
  onSubmit: () => void;
  onCancel: () => void;
}

export default function NewUser({onSubmit, onCancel}: Args) {

  return (
    <Form>
      <Row className="mb-3">
        <Form.Group as={Col} controlId="formGridUsername">
          <Form.Label>Username</Form.Label>
          <Form.Control placeholder="Username" />
        </Form.Group>

        <Form.Group as={Col} controlId="formGridEmail">
          <Form.Label>Email</Form.Label>
          <Form.Control type="email" placeholder="Email" />
        </Form.Group>
      </Row>

      <Row className="mb-3">
        <Form.Group as={Col} controlId="formGridPassword1">
          <Form.Label>Password</Form.Label>
          <Form.Control type="password" placeholder="Password" />
        </Form.Group>

        <Form.Group as={Col} controlId="formGridPassword2">
          <Form.Label>Confirm Password</Form.Label>
          <Form.Control type="password" placeholder="Password" />
        </Form.Group>
      </Row>

      <Button onClick={onCancel} variant="secondary" type="submit">
        Cancel
      </Button>

      <Button className="mx-3" variant="primary" type="submit">
        Submit
      </Button>
    </Form>
  );
}
