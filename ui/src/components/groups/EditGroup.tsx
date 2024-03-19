import { useEffect, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import { fetcher_patch } from 'utils/fetcher';
import type {Group, NewGroup, CreatedGroup} from "./types";
import { useResource } from 'hooks/resource';
import { SelectItem, ScopeType } from 'types';
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

type Args = {
  group_id: number;
  onSave: (group: Group) => void;
  onCancel: () => void;
}

export default function EditGroup({group_id, onSave, onCancel}: Args) {
  const vowScopes = useResource<ScopeType>("/api/scopes/");
  const [allScopes, setAllScopes] = useState<Array<SelectItem>>([]);
  const vow = useResource<Group>(`/api/groups/${group_id}`);
  const [controller, setController] = useState<AbortController>(new AbortController());
  const [save_in_progress, setSaveInProgress] = useState(false);
  const [ error, setError ] = useState<string|undefined>();
  const [ name, setName ] = useState<string|null>();
  const [ scopes, setScopes ] = useState<Array<SelectItem>>([]);
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
    }).catch((error?: Error) => {
      setSaveInProgress(false);
      if (error) {
        toasts?.addToast("error", `Error while updating group: ${error.toString()}`);
      }
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
