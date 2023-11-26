import { createRoot } from "react-dom/client";
import { get_default_headers } from 'utils/fetcher';

import type { MovedDocumentType, DocumentType, MovedNodesType, TargetFolder } from 'types';
import { MODALS } from 'cconstants';
import GenericModal from 'components/modals/Generic';


type Args = {
  onCancel: () => void;
  onOK: (arg: MovedDocumentType) => void;
  doc: DocumentType;
  target_folder: TargetFolder;
}


async function api_move_nodes(
  source_id: string,
  target_id: string,
  signal: AbortSignal
): Promise<Response> {
  return fetch(
    '/api/nodes/move',
    {
      'method': 'POST',
      'headers': get_default_headers(),
      'body': JSON.stringify({
        source_ids: [source_id],
        target_id: target_id
      }),
      'signal': signal
    },
  );
}


const MoveDocumentModal = ({
  onCancel,
  onOK,
  doc,
  target_folder
}: Args) => {

  const handleSubmit = async (signal: AbortSignal) => {
    let response = await api_move_nodes(
      doc.id,
      target_folder.id,
      signal
    );

    await response.json();

    if (response.status == 200) {
      onOK({
        doc: doc,
        target_folder: target_folder
      });
    }
  }

  const handleCancel = () => {
    onCancel();
  }

  return (
    <GenericModal
      modal_title='Move Document'
      submit_button_title='Move'
      onSubmit={handleSubmit}
      onCancel={handleCancel}>
        Do you want to move <span className='text-primary'>
          {doc.title}
        </span> to <span className='text-success'>{target_folder.title}</span>?
    </GenericModal>
  );
}

type MoveDocumentArgs = {
  doc: DocumentType;
  target_folder: TargetFolder;
}


function move_document({doc, target_folder}: MoveDocumentArgs) {
  let modals = document.getElementById(MODALS);

  let promise = new Promise<MovedDocumentType>(function(onOK, onCancel){
    if (modals) {
      let dom_root = createRoot(modals);

      dom_root.render(
        <MoveDocumentModal
          doc={doc}
          target_folder={target_folder}
          onOK={onOK}
          onCancel={onCancel} />
      );
    }
  }); // new Promise...

  return promise;
}

export default move_document;
