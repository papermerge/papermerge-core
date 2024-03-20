import { useState, useEffect } from 'react';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import { fetcher_post } from 'utils/fetcher';
import type {User, NewUser, CreatedUser} from "./types";
import type { Group, Paginated, ScopeType, SelectItem } from 'types';
import DualSelect from 'components/DualSelect';
import { useResource } from 'hooks/resource';
import { sortItemsFn } from 'utils/misc';
import useToast from 'hooks/useToasts';


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
  const vowScopes = useResource<ScopeType>("/api/scopes/");
  const [allScopes, setAllScopes] = useState<Array<SelectItem>>([]);
  const [scopes, setScopes] = useState<Array<string>>([]);

  const vowGroups = useResource<Paginated<Group>>("/api/groups/?page_size=999");
  const [allGroups, setAllGroups] = useState<Array<SelectItem>>([]);
  const [groups, setGroups] = useState<Array<string>>([]);

  const [controller, setController] = useState<AbortController>(new AbortController());
  const [save_in_progress, setSaveInProgress] = useState(false);
  const [ error, setError ] = useState<string|undefined>();
  const [ username, setUsername ] = useState<string|null>();
  const [ email, setEmail ] = useState<string|null>();
  const [ password1, setPassword1 ] = useState<string|null>();
  const [ password2, setPassword2 ] = useState<string|null>();
  const [ is_superuser, setIsSuperuser] = useState<boolean>(false);
  const [ is_active, setIsActive] = useState<boolean>(false);
  const toasts = useToast();

  useEffect(() => {
    if (vowScopes.data == null) {
      return;
    }
    let selectItems: Array<SelectItem> = [];

    for (const i of Object.entries(vowScopes.data)) {
      selectItems.push({
        key: i[0],
        value: i[1]
      });
    }

    selectItems.sort(sortItemsFn);
    setAllScopes(selectItems);

  }, [vowScopes.data]);

  useEffect(() => {
    if (vowGroups.data == null) {
      return;
    }
    let selectItems: Array<SelectItem> = [];

    for (const i of Object.entries(vowGroups.data.items)) {
      selectItems.push({
        key: i[1].id,
        value: i[1].name
      });
    }

    selectItems.sort(sortItemsFn);
    setAllGroups(selectItems);

  }, [vowGroups.data]);

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

  const onScopesChange = (scopes: Array<SelectItem>) => {
    setScopes(scopes.map(item => item.key));
  }

  const onGroupsChange = (groups: Array<SelectItem>) => {
    setGroups(
      groups.map(item => item.key)
     );
  }

  const onChangeIsSuperuser = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsSuperuser(e.target.checked);
  }

  const onChangeIsActive = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsActive(e.target.checked);
  }

  const onLocalSubmit = () => {

    if (!validate()) {
      return;
    }

    const item: NewUser = {
      username: username!,
      email: email!,
      password: password1!,
      is_superuser: is_superuser,
      is_active: is_active,
      scopes: scopes,
      group_ids: groups.map(i => parseInt(i))
    };

    fetcher_post<NewUser, CreatedUser>(
      `/api/users/`, item,
      controller.signal
    ).then((new_item: User) => {
      setSaveInProgress(false);
      setController(new AbortController());
      onSave(new_item);
    }).catch((error?: Error) => {
      if (error) {
        toasts?.addToast("error", `Error creating user: ${error.toString()}`);
      }
    }) ;

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

      <Row className="mb-3">
          <Form.Group as={Col} controlId="formGridIsSuperuser">
            <Form.Check
                checked={is_superuser}
                onChange={onChangeIsSuperuser}
                type="checkbox"
                id="is-superuser-flag"
                label="Is Superuser?" />
          </Form.Group>
          <Form.Group as={Col} controlId="formGridIsActive">
            <Form.Check
                checked={is_active}
                onChange={onChangeIsActive}
                type="checkbox"
                id="is-active-flag"
                label="Is Active?" />
          </Form.Group>
      </Row>

      <Row className='mb-3'>
          <Form.Label>Groups</Form.Label>
          <DualSelect
            allItems={allGroups}
            initialSelect={[]}
            onChange={onGroupsChange} />
      </Row>

      <Row className='mb-3'>
          <Form.Label>Permissions</Form.Label>
          <DualSelect
            allItems={allScopes}
            initialSelect={[]}
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
