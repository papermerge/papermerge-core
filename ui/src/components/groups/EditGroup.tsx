import { useState } from 'react';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import { fetcher_patch } from 'utils/fetcher';
import type {Group, NewGroup, CreatedGroup} from "./types";


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

type ArgsPassword = {
  change_password: boolean;
  onChangePassword: (flag: boolean) => void;
  onChangePassword1: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onChangePassword2: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

function Password({
  change_password,
  onChangePassword,
  onChangePassword1,
  onChangePassword2
}: ArgsPassword) {


  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChangePassword(e.target.checked);
  }


  return (
    <div>
      <Row className="mb-3">
        <Form.Group as={Col}>
            <Form.Check
                checked={change_password}
                onChange={onChange}
                type="checkbox"
                id="change-password-checkbox"
                label="Change Password" />
        </Form.Group>
      </Row>

      {change_password && <Row className="mb-3">
        <Form.Group as={Col} controlId="formGridPassword1">
          <Form.Label>Password</Form.Label>
          <Form.Control onChange={onChangePassword1} type="password" placeholder="Password" />
        </Form.Group>

        <Form.Group as={Col} controlId="formGridPassword2">
          <Form.Label>Confirm Password</Form.Label>
          <Form.Control onChange={onChangePassword2} type="password" placeholder="Password" />
        </Form.Group>
      </Row>}
  </div>
  );
}


type Args = {
  group: Group;
  onSave: (group: Group) => void;
  onCancel: () => void;
}


export default function EditGroup({group, onSave, onCancel}: Args) {
  const [controller, setController] = useState<AbortController>(new AbortController());
  const [save_in_progress, setSaveInProgress] = useState(false);
  const [ error, setError ] = useState<string|undefined>();
  const [ name, setName ] = useState<string>(group.name);

  const onChangeName = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.currentTarget.value);
  }

  const onLocalSubmit = () => {

    if (!validate()) {
      return;
    }

    const item: NewGroup = {
      name: name,
    };

    fetcher_patch<NewGroup, CreatedGroup>(
      `/api/groups/${group.id}`, item,
      controller.signal
    ).then((new_item: Group) => {
      setSaveInProgress(false);
      setController(new AbortController());
      onSave(new_item);
    });
  }

  const validate = () => {
    if (!name) {
      setError(`name field is empty`);
      return false;
    }

    return true;
  }

  return (
    <Form className='users'>
      <Row className="mb-3">
        <Form.Group as={Col} controlId="formGridUsername">
          <Form.Label>Username</Form.Label>
          <Form.Control
            onChange={onChangeName}
            value={name}
            placeholder="name" />
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
