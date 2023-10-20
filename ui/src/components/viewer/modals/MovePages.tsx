import { MODALS } from 'cconstants';
import GenericModal from 'components/modals/Generic';
import { createRoot } from "react-dom/client";
import MoveOptions from './MoveOptions';


type Args = {
  onCancel: () => void;
  onOK: (arg: string) => void;
  source_page_ids: Array<string>;
  target_page_id: string;
  target_doc_title: string;
}


const MovePagesModal = ({
  onCancel,
  onOK,
  source_page_ids,
  target_page_id,
  target_doc_title
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
  const handleSubmit = async () => {
    onOK("code 7");
  }

  return (
    <GenericModal
      modal_title="Move Selected Pages"
      submit_button_title="Move Pages"
      onSubmit={handleSubmit}
      onCancel={onCancel}>
        Do you want to move selected pages to document '{target_doc_title}'?
        <MoveOptions />
    </GenericModal>
  );
}

type MovePageArgs = {
  source_page_ids: Array<string>;
  target_page_id: string;
  target_doc_title: string;
}

function move_pages({
  source_page_ids,
  target_page_id,
  target_doc_title
}: MovePageArgs) {
  let modals = document.getElementById(MODALS);

  let promise = new Promise<string>(function(onOK, onCancel){
    if (modals) {
      let dom_root = createRoot(modals);

      dom_root.render(
        <MovePagesModal
          source_page_ids={source_page_ids}
          target_page_id={target_page_id}
          target_doc_title={target_doc_title}
          onOK={onOK}
          onCancel={onCancel} />
      );
    }
  }); // new Promise...

  return promise;
}

export default move_pages;
