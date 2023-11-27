import { MODALS } from 'cconstants';
import { useState } from 'react';
import { createRoot } from "react-dom/client";

import GenericModal from 'components/modals/Generic';
import { fetcher_delete } from 'utils/fetcher';
import { DocumentType } from 'types';


type Args = {
  onCancel: () => void;
  onOK: (node_ids: string[]) => void;
  doc: DocumentType;
}


async function api_delete_nodes(
  node_ids: string[],
  signal: AbortSignal
): Promise<string[]|Response> {
  return fetcher_delete<string[], string[]>('/api/nodes/', node_ids, signal);
}

const DeleteDocumentModal = ({onOK, onCancel, doc}: Args) => {
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (signal: AbortSignal) => {
    let response = await api_delete_nodes([doc.id], signal);
    onOK([doc.id]);
  }

  const handleCancel = () => {
    setErrorMessage('');

    onCancel();
  }

  return (
    <GenericModal
      modal_title='Delete'
      submit_button_title='Delete Document'
      submit_button_variant='danger'
      onSubmit={handleSubmit}
      onCancel={handleCancel}>
        <p>Are you sure you want delete {doc.title}?</p>
    </GenericModal>
  );
}

function delete_document(doc: DocumentType) {
  let modals = document.getElementById(MODALS);

  let promise = new Promise<string[]>(function(onOK, onCancel){
    if (modals) {
      let dom_root = createRoot(modals);

      dom_root.render(
        <DeleteDocumentModal
          doc={doc}
          onOK={onOK}
          onCancel={onCancel} />
      );
    }
  }); // new Promise...

  return promise;
}

export default delete_document;
