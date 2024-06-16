import { MODALS } from 'cconstants';
import { useState } from 'react';
import { createRoot } from "react-dom/client";

import GenericModal from 'components/modals/Generic';
import { get_default_headers } from 'utils/fetcher';
import { Group } from './types';

type Args = {
  onCancel: (msg?: string) => void;
  onOK: (group_id: number) => void;
  group: Group;
}


async function api_delete_group(url: string, signal: AbortSignal): Promise<string|Response> {
  return fetch(
    url, {
      method: "delete",
      headers: get_default_headers(),
      signal: signal
    }
  ).then(res => {
    if (res.status === 401) {
      throw Error(`${res.status} ${res.statusText}`);
    }
    return res;
  });;
}

const DeleteGroupModal = ({onOK, onCancel, group}: Args) => {
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (signal: AbortSignal) => {
    try {
      let response = await api_delete_group(`/api/groups/${group.id}`, signal);
      onOK(group.id);
    } catch (error: any) {
      onCancel(error.toString());
    }
  }

  const handleCancel = () => {
    setErrorMessage('');

    onCancel();
  }

  return (
    <GenericModal
      modal_title='Delete Group'
      submit_button_title='Delete Group'
      submit_button_variant='danger'
      onSubmit={handleSubmit}
      onCancel={handleCancel}>
        <p>
          Are you sure you want to delete group <b>{group.name}</b>?
        </p>
    </GenericModal>
  );
}

function delete_group(group: Group) {
  let modals = document.getElementById(MODALS);

  let promise = new Promise<number>(function(onOK, onCancel){
    if (modals) {
      let dom_root = createRoot(modals);

      dom_root.render(
        <DeleteGroupModal
          group={group}
          onOK={onOK}
          onCancel={onCancel} />
      );
    }
  }); // new Promise...

  return promise;
}

export default delete_group;
