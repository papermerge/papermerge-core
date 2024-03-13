import { useEffect, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import { fetcher_patch } from 'utils/fetcher';
import type {Group, NewGroup, CreatedGroup} from "./types";
import { useResource } from 'hooks/resource';
import { SelectItem } from 'types';
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
  group_id: number;
  onSave: (group: Group) => void;
  onCancel: () => void;
}


export default function EditGroup({group_id, onSave, onCancel}: Args) {
  const vow = useResource<Group>(`/api/groups/${group_id}`);
  const [controller, setController] = useState<AbortController>(new AbortController());
  const [save_in_progress, setSaveInProgress] = useState(false);
  const [ error, setError ] = useState<string|undefined>();
  const [ name, setName ] = useState<string|null>();
  const [ scopes, setScopes ] = useState<Array<SelectItem>>([]);

  useEffect(() => {
    if (vow.data) {
      setName(vow.data.name);
      setScopes(vow.data.scopes.map((i) => {return {key:i, value: i}}));
      console.log(`scopes ${vow.data.scopes}`)
    }
  }, [vow.data]);

  const onChangeName = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.currentTarget.value);
  }

  const onScopesChange = (scopes: Array<SelectItem>) => {
    setScopes(scopes);
  }

  const onLocalSubmit = () => {

    if (!validate()) {
      return;
    }

    const item: NewGroup = {
      name: name!,
      scopes: scopes.map(i => i.key)
    };

    fetcher_patch<NewGroup, CreatedGroup>(
      `/api/groups/${group_id}`, item,
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
            value={ name || ''}
            placeholder="name" />
        </Form.Group>
      </Row>

      <Row className='mb-3'>
        <DualSelect
          initialSelect={scopes}
          onChange={onScopesChange} />
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
