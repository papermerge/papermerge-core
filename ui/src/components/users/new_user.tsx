import { useState } from 'react';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import { fetcher_post } from 'utils/fetcher';
import type {User, NewUser, CreatedUser} from "./types";


type ErrorArgs = {
  message?: string;
}

function Error({message}: ErrorArgs) {
  if (message) {
    return <div className='text-danger my-2 py-2'>
      {message}
    </div>
  }

  return <div />;
}


type Args = {
  onSave: (user: User) => void;
  onCancel: () => void;
}


export default function NewUser({onSave, onCancel}: Args) {
  const [controller, setController] = useState<AbortController>(new AbortController());
  const [save_in_progress, setSaveInProgress] = useState(false);
  const [ error, setError ] = useState<string|undefined>();
  const [ username, setUsername ] = useState<string|null>();
  const [ email, setEmail ] = useState<string|null>();
  const [ password1, setPassword1 ] = useState<string|null>();
  const [ password2, setPassword2 ] = useState<string|null>();

  const onChangeUsername = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.currentTarget.value);
  }

  const onChangeEmail = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.currentTarget.value);
  }

  const onChangePassword1 = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword1(e.currentTarget.value);
  }

  const onChangePassword2 = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword2(e.currentTarget.value);
  }

  const onLocalSubmit = () => {

    if (!validate()) {
      return;
    }

    const item: NewUser = {
      username: username!,
      email: email!,
      password: password1!
    };

    fetcher_post<NewUser, CreatedUser>(
      `/api/users/`, item,
      controller.signal
    ).then((new_item: User) => {
      setSaveInProgress(false);
      setController(new AbortController());
      onSave(new_item);
    });

  }

  const validate = () => {
    if (!username) {
      setError(`username field is empty`);
      return false;
    }

    if (!email) {
      setError(`email field is empty`);
      return false;
    }

    if (!password1 || !password2) {
      setError(`Password field is empty`);
      return false;
    }

    if (password1 != password2) {
      setError(`Password and password confirmation are different`);
      return false;
    }

    return true;
  }

  return (
    <Form className='users'>
      <Row className="mb-3">
        <Form.Group as={Col} controlId="formGridUsername">
          <Form.Label>Username</Form.Label>
          <Form.Control onChange={onChangeUsername} placeholder="Username" />
        </Form.Group>

        <Form.Group as={Col} controlId="formGridEmail">
          <Form.Label>Email</Form.Label>
          <Form.Control onChange={onChangeEmail} type="email" placeholder="Email" />
        </Form.Group>
      </Row>

      <Row className="mb-3">
        <Form.Group as={Col} controlId="formGridPassword1">
          <Form.Label>Password</Form.Label>
          <Form.Control onChange={onChangePassword1} type="password" placeholder="Password" />
        </Form.Group>

        <Form.Group as={Col} controlId="formGridPassword2">
          <Form.Label>Confirm Password</Form.Label>
          <Form.Control onChange={onChangePassword2} type="password" placeholder="Password" />
        </Form.Group>
      </Row>

      <Button onClick={onCancel} variant="secondary" type="submit">
        Cancel
      </Button>

      <Button onClick={onLocalSubmit} className="mx-3" variant="primary" type="submit">
        Submit
      </Button>

      <Error message={error}/>
    </Form>
  );
}
