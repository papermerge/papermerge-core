import { MODALS } from 'cconstants';
import { useState } from 'react';
import { createRoot } from "react-dom/client";

import GenericModal from 'components/modals/Generic';
import { DocumentType, DocumentVersion, PageType } from 'types';


type Args = {
  onCancel: () => void;
  onOK: (value: unknown) => void;
  doc_ver: DocumentVersion;
  selected_pages: Array<string>;
}


const ViewOCRTextModal = ({onOK, onCancel, doc_ver, selected_pages}: Args) => {

  let text = '';

  if (selected_pages.length == 0) {
    text = doc_ver.pages.map((p: PageType) => p.text).join('')
  }

  return (
    <GenericModal
      modal_title='OCR Text'
      submit_button_title='OK'
      onSubmit={() => onOK(null)}
      onCancel={() => onCancel()}>
        {text}
    </GenericModal>
  );
}

type ViewOCRTextArgs = {
  doc_ver: DocumentVersion;
  selected_pages: Array<string>;
}

function view_ocr_text({doc_ver, selected_pages}: ViewOCRTextArgs) {
  let modals = document.getElementById(MODALS);

  let promise = new Promise(function(onOK, onCancel){
    if (modals) {
      let dom_root = createRoot(modals);

      dom_root.render(
        <ViewOCRTextModal
          doc_ver={doc_ver}
          selected_pages={selected_pages}
          onOK={onOK}
          onCancel={onCancel} />
      );
    }
  }); // new Promise...

  return promise;
}

export default view_ocr_text;
