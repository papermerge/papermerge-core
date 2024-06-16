import { useState } from 'react';
import Form from 'react-bootstrap/Form';

import { MODALS } from 'cconstants';
import GenericModal from 'components/modals/Generic';
import { uploader } from 'utils/uploader';
import { createRoot } from "react-dom/client";
import type { CreatedNodesType, FolderType, NodeType } from 'types';


type Args = {
  onCancel: (msg?: string) => void;
  onOK: (drop_files: CreatedNodesType) => void;
  source_files: FileList;
  target: FolderType;
}


const DropFilesModal = ({
  onCancel,
  onOK,
  source_files,
  target
}: Args) => {
  /*
    Used when user drag and drops files from local files system into the Commander.

    The files upload is performed async and notification (user feedback) is
    accomplished via "toasts" (notification messages in right lower corder of
    the screen). In other words "Upload files" screen closes immediately - it
    does not wait until all files are uploaded. User can go fancy and Upload 200
    files from some folder - it does not make any sense for the upload dialog to
    be open for until all those 200 files get uploaded.
  */
  const [skipOCR, setSkipOCR] = useState<boolean>(false);

  const onLocalCheck = () => {
    let new_checked_value = !skipOCR;

    setSkipOCR(new_checked_value);
  }

  const handleSubmit = async () => {
    uploader({
      files: source_files,
      node_id: target.id,
      skip_ocr: skipOCR
    })
    .then(
      (drop_files: CreatedNodesType) => onOK(drop_files)
    ).catch((error: Error) => {
       console.log(error);
    });
  }

  let source_titles: Array<string> = [];

  if (source_files) {
    source_titles = [...source_files].map(n => n.name);
  }

  const target_title = target.title;

  return (
    <GenericModal
      modal_title="Upload"
      submit_button_title="Upload"
      onSubmit={handleSubmit}
      onCancel={onCancel}>
        Are you sure you want to upload <span className='text-primary'>
          {source_titles.join(', ')}
        </span> to <span className='text-success'>{target_title}</span>?
        <p className='pt-3'>
          <Form.Check
            onChange={onLocalCheck}
            type="checkbox"
            label={`Skip OCR`} />
        </p>
    </GenericModal>
  );
}

type DropFileArgs = {
  source_files: FileList;
  target: FolderType;
}

function drop_files({source_files, target}: DropFileArgs) {
  let modals = document.getElementById(MODALS);

  let promise = new Promise<CreatedNodesType>(function(onOK, onCancel){
    if (modals) {
      let dom_root = createRoot(modals);

      dom_root.render(
        <DropFilesModal
          source_files={source_files}
          target={target}
          onOK={onOK}
          onCancel={onCancel} />
      );
    }
  }); // new Promise...

  return promise;
}

export default drop_files;
