import { useState, useEffect } from 'react';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import { fetcher_patch } from 'utils/fetcher';
import { useResource } from 'hooks/resource';
import type {User, NewUser, CreatedUser, UserDetail} from "./types";
import type { Paginated, ScopeType,  SelectItem, Group } from 'types';
import DualSelect from 'components/DualSelect';
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
  user_id: string;
  onSave: (user: User) => void;
  onCancel: () => void;
}


export default function EditUser({user_id, onSave, onCancel}: Args) {
  const vow = useResource<UserDetail>(`/api/users/${user_id}`);

  const vowScopes = useResource<ScopeType>("/api/scopes/");
  const [allScopes, setAllScopes] = useState<Array<SelectItem>>([]);
  const [scopes, setScopes] = useState<Array<SelectItem>>([]);

  const vowGroups = useResource<Paginated<Group>>("/api/groups/?page_size=999");
  const [allGroups, setAllGroups] = useState<Array<SelectItem>>([]);
  const [groups, setGroups] = useState<Array<SelectItem>>([]);

  const [controller, setController] = useState<AbortController>(new AbortController());
  const [save_in_progress, setSaveInProgress] = useState(false);
  const [ error, setError ] = useState<string|undefined>();
  const [ username, setUsername ] = useState<string>('');
  const [ email, setEmail ] = useState<string>('');
  const [ password1, setPassword1 ] = useState<string|null>();
  const [ password2, setPassword2 ] = useState<string|null>();
  const [ change_password, setChangePassword] = useState<boolean>(false);
  const [ is_superuser, setIsSuperuser] = useState<boolean>(false);
  const [ is_active, setIsActive] = useState<boolean>(false);
  const toasts = useToast();

  useEffect(() => {
    if (vow.data == null) {
      return;
    }

    setUsername(vow.data.username);
    setEmail(vow.data.email);
    setScopes(
      vow.data.scopes.map(i => {return {key: i, value: i}})
     );
    setGroups(
      vow.data.groups.map(i => {return {key: `${i.id}`, value: i.name}})
    );
    setIsSuperuser(vow.data.is_superuser);
    setIsActive(vow.data.is_active);

  }, [vow.data]);

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

  const onChangePassword = (flag: boolean) => {
    setChangePassword(flag);
  }

  const onScopesChange = (scopes: Array<SelectItem>) => {
    setScopes(scopes);
  }

  const onGroupsChange = (groups: Array<SelectItem>) => {
    setGroups(groups);
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
      username: username,
      email: email,
      password: password1!,
      scopes: scopes.map(i => i.key),
      is_superuser: is_superuser,
      is_active: is_active,
      group_ids: groups.map(i => parseInt(i.key))
    };

    fetcher_patch<NewUser, CreatedUser>(
      `/api/users/${user_id}`, item,
      controller.signal
    ).then((new_item: User) => {
      setSaveInProgress(false);
      setController(new AbortController());
      onSave(new_item);
    }).catch((error: Error) => {
      setSaveInProgress(false);
      toasts?.addToast("error", `Error while updating user: ${error.toString()}`);
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

    if (!change_password) {
      return true;
    }

    // change_password == true
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
          <Form.Control
            onChange={onChangeUsername}
            value={username}
            placeholder="Username" />
        </Form.Group>

        <Form.Group as={Col} controlId="formGridEmail">
          <Form.Label>Email</Form.Label>
          <Form.Control
            onChange={onChangeEmail}
            value={email}
            type="email"
            placeholder="Email" />
        </Form.Group>
      </Row>

      <Password
        change_password={change_password}
        onChangePassword={onChangePassword}
        onChangePassword1={onChangePassword1}
        onChangePassword2={onChangePassword2} />

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
            initialSelect={groups}
            onChange={onGroupsChange} />
      </Row>

      <Row className='mb-3'>
          <Form.Label>Permissions</Form.Label>
          <DualSelect
            allItems={allScopes}
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
