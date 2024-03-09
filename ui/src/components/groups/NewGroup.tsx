import { useState } from 'react';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import { fetcher_post } from 'utils/fetcher';
import type {Group, NewGroup, CreatedGroup} from "./types";

import DualSelect from 'components/DualSelect';

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
  onSave: (group: Group) => void;
  onCancel: () => void;
}


export default function NewGroup({onSave, onCancel}: Args) {

  const [controller, setController] = useState<AbortController>(new AbortController());
  const [save_in_progress, setSaveInProgress] = useState(false);
  const [ error, setError ] = useState<string|undefined>();
  const [ name, setName ] = useState<string|null>();

  const onChangeName = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.currentTarget.value);
  }

  const onLocalSubmit = () => {

    if (!validate()) {
      return;
    }

    const item: NewGroup = {
      name: name!,
    };

    fetcher_post<NewGroup, CreatedGroup>(
      `/api/users/`, item,
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
        <Form.Group as={Col} controlId="formGridName">
          <Form.Label>Name</Form.Label>
          <Form.Control onChange={onChangeName} placeholder="Group name" />
        </Form.Group>
      </Row>

      <Row className='mb-3'>
        <DualSelect />
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
