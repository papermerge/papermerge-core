import { MODALS } from 'cconstants';
import { useState } from 'react';
import { createRoot } from "react-dom/client";

import GenericModal from 'components/modals/Generic';
import { fetcher_delete } from 'utils/fetcher';


type Args = {
  onCancel: (msg?: string) => void;
  onOK: (node_ids: string[]) => void;
  node_ids: string[];
}


async function api_delete_nodes(
  node_ids: string[],
  signal: AbortSignal
): Promise<string[]|Response> {
  return fetcher_delete<string[], string[]>('/api/nodes/', node_ids, signal);
}

const DeleteNodesModal = ({onOK, onCancel, node_ids}: Args) => {
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (signal: AbortSignal) => {
    try {
      let response = await api_delete_nodes(node_ids, signal);
      onOK(node_ids);
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
      modal_title='Delete Selected Nodes'
      submit_button_title='Delete Selected Nodes'
      submit_button_variant='danger'
      onSubmit={handleSubmit}
      onCancel={handleCancel}>
        <p>Are you sure?</p>
    </GenericModal>
  );
}

function delete_nodes(node_ids: string[]) {
  let modals = document.getElementById(MODALS);

  let promise = new Promise<string[]>(function(onOK, onCancel){
    if (modals) {
      let dom_root = createRoot(modals);

      dom_root.render(
        <DeleteNodesModal
          node_ids={node_ids}
          onOK={onOK}
          onCancel={onCancel} />
      );
    }
  }); // new Promise...

  return promise;
}

export default delete_nodes;
